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
├── access-snapshot-factory.ts     # validates the tenancy invariant + seals a snapshot
├── access-core.ts                 # façade: can, tenants, switchTenant, recordDenial
├── access-session.ts              # useLoader / start / sync / end a session
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
├── session-repository.ts          # the injectable face of the session loader
└── access-session-service.ts      # installs that loader, then start / end

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
   to the active tenant, and an active tenant outside the claimed membership list is
   ignored in favour of a real membership. When the token carries **no** recognised
   role, the principal falls back to `DEFAULT_ROLE` — deliberately the **least**
   privileged role, so an unrecognised or narrowed server role is never upgraded into
   write access. When it carries no `sub` — absent, or blank once trimmed — the principal
   id is a random opaque uuid, the same no-PII identity rule the observability boundary
   follows; a blank subject is never honoured as an identity of its own, which would
   conflate every malformed token into one.

The claims are read, not verified: this layer never checks the JWT signature, and it
must not, because a client cannot establish authenticity about itself. A tampered token
buys nothing but a misleading UI — every request it accompanies is still rejected by the
server. Nothing here is an authorization decision; it decides what to render.

`SessionFactory` is the default **session loader**. Replacing where a session comes
from is one call — `accessSession.useLoader(myLoader)` — and every hydration path,
render and DI alike, follows it. `SessionRepository` is that loader's injectable
face: constructing `AccessSessionService` installs the container's binding as the
loader, so overriding `ACCESS_TOKENS.SessionRepository` also redirects the render
path. The access composition root resolves that service as it registers it — nothing
in the application does, so registration alone would leave the binding inert — and the
container itself is only ever imported behind a dynamic `import()`, so this costs the
paint path nothing. A loader must stay synchronous; an endpoint-backed session belongs behind a
cache the loader reads, not behind an `await`.

## When the session is hydrated

- **Login** — the auth composition root (`@auth/stores/index.ts`) calls
  `accessSession.sync()` once the login action settles, which logs a `login` audit event.
- **Any protected route** — `ProtectedRoute` syncs the session at module load, before
  the first render, so a token that was seeded rather than typed (Playwright,
  Lighthouse) is already authorized when the gated page first renders. Doing this from
  an effect would not work: `useSyncExternalStore` subscribes in a _passive_ effect, so
  a store write issued from a layout effect in the same commit reaches no subscriber and
  the gated page would paint one empty frame and defer its own chunk request. A layout
  effect still re-syncs on a token change, and re-hydrates if a session was ended under
  a still-valid token. `sync()` is idempotent per token: re-rendering never re-hydrates
  and never emits a duplicate `login` event.
- **Logout** — `authActions.logout` calls `accessSession.end()`, which logs `logout`
  while the principal is still known, then clears the state.

Every published snapshot is **sealed**, not merely wrapped in a frozen object: the
principal, its roles, its permissions and each membership are frozen in place, so a
holder of the principal cannot rewrite a decision after it was made — and the identity
of the snapshot is preserved, which is what `useSyncExternalStore` compares. A principal
whose active tenant is not one of its own memberships is **refused**: `setSession`
returns `false`, the store keeps the session it had, and `accessSession.start` reports
failure without memoizing the token, so the next `sync` tries again rather than trusting
a session that never was. `SessionFactory` already reconciles a claimed tenant against
the membership list, so the refusal is the store keeping its own invariant rather than
trusting a caller.

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

Two contract errors the `RouteValidator` throws on, because the composer would
otherwise drop the declaration and ship an **ungated** route: a permission on a nested
child route, and a permission on a route that is not `guard: 'protected'`.

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
tenant, then hands it to the installed `AuditSink`. The default sink drops events;
a deployment installs a real one with `auditCore.useSink(mySink)` at app entry. That
seam is deliberately container-free: the DI graph loads lazily on the first auth
action, so anything wired only during registration would miss every event on a
reload-with-token session. A sink that throws can never break a user flow.

Recorded events: `login`, `logout`, `tenant_switch` (with `from`/`to`),
`sensitive_action` (for a feature's own security-relevant mutations), and
`permission_denied` (with the permission, the refused path, and — for a tenant switch —
whether the refusal was a missing permission or a missing membership). Every session
that ends, including one replaced by another login, closes with a `logout` event while
its principal is still known, so the trail reconciles into whole sessions.

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

- **dependency-cruiser `no-ui-to-access-services`** — no UI layer (`components`,
  `routes`, `providers`, `features`, `hooks`) may resolve an access service directly;
  they go through the hooks seam, which keeps tsyringe off the paint path.
- **dependency-cruiser `no-ui-to-access-state`** — the UI may not import the state store
  directly: `setSession` / `setActiveTenant` bypass the permission and membership checks
  in `switchTenant` and emit no audit event. The exemption names exactly two files —
  `src/hooks/use-access.ts` and `src/hooks/use-access-snapshot.ts` — so a new hook cannot
  inherit it by being named `use-access-something`.
- **dependency-cruiser `no-access-domain-to-container` / `no-access-domain-to-tsyringe`**
  — the paint-safe domain may not import the injectable services, tsyringe, or
  reflect-metadata, so the two-layer split cannot be undone by an innocent import.
- **dependency-cruiser `no-access-layer-to-modules`** — the access layer must not depend
  on a feature module: it is cross-cutting infrastructure, consumed, never consuming.
- **dependency-cruiser `no-feature-ui-to-services`** (pre-existing) — feature
  components, hooks, and routes must not reach `src/services/**`.
- **ESLint `no-restricted-syntax`** (issue #114 selectors) — no
  `principal.roles.includes(…)` / `principal.permissions.includes(…)` outside the access
  layer, and no raw permission strings at a call site: `useCan('…')`, `can('…')`,
  `permission="…"`, or `meta: { permission: '…' }`. A backtick is a quote too, so each of
  those positions rejects a template literal as well as a plain string; `canAll`/`canAny`
  are matched inside their array argument (`canAll(['…'])`), which is their natural call
  form; and the route-meta key is matched spelled bare or quoted (`{ 'permission': '…' }`).

Satisfy all of them by going through the policy layer. Never add a suppression, and
never widen the ESLint exemption beyond `src/lib/access/**` and `src/services/access/**`.

The membership gate covers the shapes that actually reach a decision — `includes`,
`some`, `every`, `find`, `findIndex`, `findLast`, `findLastIndex`, `indexOf`,
`lastIndexOf`, `filter` and `at` — each spelled as an identifier (`roles.includes(…)`)
or as a computed literal (`roles['includes'](…)`), and each through a member,
destructured, computed or optionally-chained receiver, plus the two escapes that avoid
an array method entirely (`new Set(principal.roles).has(…)` and a bare
`principal.roles[0] === …`).

That method list is a three-way contract: the `MEMBERSHIP_METHODS` regex in
`eslint.config.mjs`, the must-fail fixture in
`tests/unit/tooling/access-control-gates.test.ts`, and this paragraph. Adding a spelling
means adding it in all three — the fixture asserts an exact finding count, so a method
that falls out of the regex fails the suite instead of silently opening a hole.

Reading the collection to _render_ it is still allowed: showing a user their own roles is
not an authorization decision, and neither is `new Set(principal.roles).size` for display.
The Set escape is matched at its `.has(…)` use rather than at the constructor for exactly
that reason.

**Known limitation.** It remains a syntactic guardrail, not a security boundary — a
determined rewrite can still evade any AST matcher, and an `as Permission` cast will
launder a literal past the call-site rule. Review is the backstop. The real
enforcement is that the server is authoritative: nothing here decides access, it
only decides what to render.
