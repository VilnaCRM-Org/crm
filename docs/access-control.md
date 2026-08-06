# Access control: authorization, tenancy, feature flags, audit (issue #114)

Authentication answers _who are you_; this layer answers _what may you do, in which
tenant, and what did you just try_. It is a **client-side mirror** of the server's
decision — the server stays the source of truth. The client layer exists for UX (never
render an affordance the principal cannot use) and defense in depth, never as the only
gate.

## Layout

The layer is split so the authenticated paint path never pulls tsyringe, zod, or Apollo
— the same two-layer shape the observability boundary uses (issue #115).

```text
src/lib/access/                    # dependency-free domain + state (paint-safe, no DI)
├── permission-catalog.ts          # PERMISSIONS, ROLES, ROLE_PERMISSIONS, DEFAULT_ROLE
├── permission-resolver.ts         # role → permission expansion, can/canAll/canAny
├── feature-flag-catalog.ts        # FEATURE_FLAGS + FEATURE_FLAG_DEFAULTS
├── access-state.ts                # the principal/flags store (useSyncExternalStore source)
├── access-core.ts                 # façade: can, tenants, switchTenant, recordDenial
├── access-session.ts              # start / sync / end a session
├── session-claims-reader.ts       # JWT payload → claims (no dependencies)
├── claims-mapper.ts               # untyped claims → typed SessionClaims
├── session-factory.ts             # claims → Principal + flags
├── audit-core.ts                  # stamps and forwards audit events to the sink
├── noop-audit-sink.ts             # default sink (drops events)
└── policies/edit-contact-policy.ts

src/services/access/               # @injectable adapters + the DI composition root
├── tokens.ts                      # ACCESS_TOKENS
├── di.ts                          # accessRegistrar (a ModuleRegistrar)
├── permission-service.ts          # PermissionService: can / canAll / canAny
├── policy-evaluator.ts            # evaluates a Policy<TSubject> against the principal
├── tenant-context-service.ts      # active / available / switchTo
├── feature-flag-service.ts        # isEnabled
├── audit-logger.ts                # log(event)
├── session-repository.ts          # loads the session snapshot (the swap seam)
└── access-session-service.ts      # start / end, through the repository

src/lib/types/access/              # type-only files (Permission, Role, Principal, …)

React seam:
src/hooks/use-access.ts            # snapshot reader used by every access hook
src/hooks/use-access-snapshot.ts   # useSyncExternalStore subscription over access-state
src/hooks/use-can.ts               # useCan(permission) -> boolean
src/hooks/use-principal.ts
src/hooks/use-tenant.ts
src/hooks/use-feature-flag.ts
src/providers/access-context.ts    # context published by AccessProvider
src/providers/access-provider.tsx  # mounted by AppProviders
src/components/require-permission/ # <RequirePermission permission={…}>
src/components/access-denied/      # the 403 panel rendered in place by the route gate
src/routes/permission-route.tsx    # route element that gates a branch by permission
src/routes/permission-branch-builder.tsx
```

## How a principal is built

There is no dedicated roles endpoint yet, so the principal is derived from the **signed
access token's claims** — the server issues them, the client only reads them:

1. `SessionClaimsReader` splits the JWT and base64url-decodes the payload. A non-JWT,
   an unparsable payload, or a payload that is not a JSON object yields `null` claims.
2. `ClaimsMapper` narrows the untyped payload: every claim is validated by shape and
   anything unexpected is dropped, never coerced.
3. `SessionFactory` builds the `Principal`: claimed roles are filtered to the known
   `Role` set, permissions are expanded from those roles, and the tenant list defaults
   to the active tenant. When the token carries **no** recognised role, the principal
   falls back to `DEFAULT_ROLE` so an opaque server token still yields a usable session.
   When it carries no `sub`, the principal id is a random opaque uuid — the same
   no-PII identity rule the observability boundary follows.

`SessionRepository` is the seam to replace when the server grows a real session
endpoint: give it an HTTP-backed `load()` and nothing else in the layer changes.

## When the session is hydrated

- **Login** — the auth composition root (`@auth/stores/index.ts`) calls
  `accessSession.sync()` once the login action settles, which logs a `login` audit event.
- **Any protected route** — `ProtectedRoute` calls `accessSession.sync()` in a
  layout effect, so a token that was seeded rather than typed (Playwright, Lighthouse)
  hydrates before paint. `sync()` is idempotent per token: re-rendering never
  re-hydrates and never emits a duplicate `login` event.
- **Logout** — `authActions.logout` calls `accessSession.end()`, which logs `logout`
  while the principal is still known, then clears the state.

Until the session is hydrated the principal is `null`, and `PermissionRoute` renders
nothing rather than a 403 — a false "access denied" flash (and a false audit event)
would be worse than one blank frame.

`useAccess` prefers the value published by `AccessProvider` and falls back to a direct
subscription on the store, so a gated subtree stays reactive even when it is rendered
outside the provider (a test harness, a Storybook story). No consumer can silently go
stale.

## Gating a route

Declare the permission as **route data** in the owning module's route contract. The
composer does the rest: protected routes that carry `meta.permission` are grouped, one
`PermissionRoute` per permission, nested inside `AppLayout` so the 403 panel keeps the
`<main>` landmark.

```ts
import { PERMISSIONS } from '@/lib/access/permission-catalog';

const contactRoutes: RouteModule = {
  id: 'crm.contacts',
  routes: [
    {
      path: '/contacts',
      guard: 'protected',
      load: () => import(/* webpackChunkName: "contacts" */ './contacts-page'),
      meta: { permission: PERMISSIONS.contactRead },
    },
  ],
};
```

A permission on a **nested** child route is a contract error (`RouteValidator` throws):
gates, like guards, are declared on a module's top-level routes.

## Gating UI

```typescript
import RequirePermission from '@/components/require-permission';
import useCan from '@/hooks/use-can';
import { PERMISSIONS } from '@/lib/access/permission-catalog';

<RequirePermission permission={PERMISSIONS.contactWrite}>
  <UIButton onClick={edit}>{t('contact.edit')}</UIButton>
</RequirePermission>;

const canDelete = useCan(PERMISSIONS.contactManageAll);
```

A denied affordance is **removed**, not disabled and not `aria-hidden`: it never existed
for this principal, so nothing should announce it. Inside a composite widget (a MUI
`Menu`, a toolbar, a tablist) pass an explicit `fallback` instead, so roving-tabindex
bookkeeping keeps its owned children.

`AccessDenied` is route-level: it owns an `h1`, sets the document title, and moves focus
to its heading because the URL does not change when a navigation is refused. Do not use
it as a `RequirePermission` fallback.

## Object-level rules: policies

Row- and field-level rules are named classes, never inline conditionals:

```ts
export class EditContactPolicy implements Policy<ContactSubject> {
  public readonly permission: Permission = PERMISSIONS.contactWrite;

  public isSatisfiedBy(principal: Principal, subject: ContactSubject): boolean {
    if (principal.tenantId !== subject.tenantId) return false;
    if (!principal.permissions.includes(this.permission)) return false;
    return (
      subject.ownerId === principal.id ||
      principal.permissions.includes(PERMISSIONS.contactManageAll)
    );
  }
}
```

Evaluate one through the injected `PolicyEvaluator`
(`ACCESS_TOKENS.PolicyEvaluator`), which supplies the current principal and records a
`permission_denied` audit event on refusal.

## Audit

`AuditCore` stamps every event with an ISO timestamp plus the current principal and
tenant, then hands it to the registered `AuditSink`. The default sink drops events;
a deployment swaps it by registering another implementation against
`ACCESS_TOKENS.AuditSink`. A sink that throws can never break a user flow.

Recorded events: `login`, `logout`, `tenant_switch`, `permission_denied` (with the
permission and the refused path).

## Extending the model

- **A permission** — add it to the `Permission` union
  (`src/lib/types/access/permission.ts`), add the matching key to `PERMISSIONS`, and
  grant it to the roles that should hold it in `ROLE_PERMISSIONS`.
- **A role** — add it to the `Role` union and give it an entry in `ROLE_PERMISSIONS`.
  Roles are additive sets, not a hierarchy in code: build a broader role by spreading
  the narrower one.
- **A policy** — add a class under `src/lib/access/policies/` implementing
  `Policy<TSubject>` and unit-test the positive, negative, cross-tenant, and
  missing-permission cases.
- **A feature flag** — add it to the `FeatureFlag` union, to `FEATURE_FLAGS`, and to
  `FEATURE_FLAG_DEFAULTS`. The server may override a default per session through the
  `flags` claim; unknown flag keys in the claim are ignored.

## Machine-enforced boundaries

- **dependency-cruiser `no-ui-to-access-services`** — `src/components/**` and
  `src/routes/**` must not resolve an access service directly; they use the hooks.
- **dependency-cruiser `no-access-layer-to-modules`** — the access layer must not depend
  on a feature module: it is cross-cutting infrastructure, consumed, never consuming.
- **dependency-cruiser `no-feature-ui-to-services`** (pre-existing) — feature
  components, hooks, and routes must not reach `src/services/**`.
- **ESLint `no-restricted-syntax`** (issue #114 selectors) — no
  `principal.roles.includes(…)` / `principal.permissions.includes(…)` outside the access
  layer, and no raw permission strings at a call site: `useCan('…')`, `can('…')`,
  `permission="…"`, or `meta: { permission: '…' }`.

Satisfy all of them by going through the policy layer. Never add a suppression, and
never widen the ESLint exemption beyond `src/lib/access/**` and `src/services/access/**`.
