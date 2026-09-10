# Access control: authorization, tenancy, access flags, audit (issue #114)

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
├── feature-flag-catalog.ts        # FEATURE_FLAGS + FEATURE_FLAG_DEFAULTS
├── access-state.ts                # the principal/flags store (useSyncExternalStore source)
├── access-snapshot-factory.ts     # validates the tenancy invariant + seals a snapshot
├── access-core.ts                 # façade: can, tenants, switchTenant, recordDenial
├── access-session.ts              # useLoader / start / sync / end a session
├── session-claims-reader.ts       # JWT payload → claims (no dependencies)
├── claims-mapper.ts               # untyped claims → typed SessionClaims
├── session-factory.ts             # claims → Principal + flags
├── mutation-catalogue.ts          # MUTATION_KEYS + isKey (the closed mutation-key set)
├── mutation-key-filter.ts         # server keys → known keys, auditing what it drops
├── mutation-access-core.ts        # can(principal, mutationKey)
├── claims-mutation-resolver.ts    # interim access source: the token's own claims
├── mutation-access-dispatcher.ts  # request → resolve → republish the access snapshot
├── audit-core.ts                  # stamps and forwards audit events to the sink
└── noop-audit-sink.ts             # default sink (drops events)

src/services/access/               # @injectable adapters + the DI composition root
├── tokens.ts                      # ACCESS_TOKENS
├── di.ts                          # accessRegistrar (a ModuleRegistrar)
├── mutation-access-service.ts     # MutationAccessService: can(mutationKey)
├── tenant-context-service.ts      # active / available / switchTo
├── feature-flag-service.ts        # isEnabled
├── audit-logger.ts                # log(event)
├── session-repository.ts          # the injectable face of the session loader
└── access-session-service.ts      # installs that loader, then start / end

src/lib/types/access/              # type-only files (MutationKey, Principal, …)

React seam:
src/hooks/use-access.ts            # snapshot reader used by every access hook
src/hooks/use-access-snapshot.ts   # useSyncExternalStore subscription over access-state
src/hooks/use-can-mutate.ts        # useCanMutate(mutationKey) -> boolean
src/hooks/use-principal.ts
src/hooks/use-tenant.ts
src/hooks/use-access-flag.ts
src/providers/access-context.ts    # context published by AccessProvider
src/providers/access-provider.tsx  # mounted by AppProviders
src/components/require-mutation/   # <RequireMutation mutation={…}>
src/components/access-denied/      # the 403 panel, routed at /access-denied
```

## How a principal is built

There is no dedicated roles endpoint yet, so the principal is derived from the **signed
access token's claims** — the server issues them, the client only reads them:

1. `SessionClaimsReader` splits the JWT and base64url-decodes the payload. A non-JWT,
   an unparsable payload, or a payload that is not a JSON object yields `null` claims.
2. `ClaimsMapper` narrows the untyped payload: every claim is validated by shape and
   anything unexpected is dropped, never coerced.
3. `SessionFactory` builds the `Principal`: claimed roles are carried through
   **verbatim**, the tenant list defaults to the active tenant, and an active tenant
   outside the claimed membership list is ignored in favour of a real membership. Roles
   grant nothing — the client keeps no role catalogue and no role → capability map, so a
   role it has never seen is neither privileged nor an error. `allowedMutations` is left
   **empty**: capability is supplied by the dispatcher, never derived here. When the token
   carries no `sub` — absent, or blank once trimmed — the principal
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
principal, its roles, its allowed mutations and each membership are frozen in place, so a
holder of the principal cannot rewrite a decision after it was made — and the identity
of the snapshot is preserved, which is what `useSyncExternalStore` compares. A principal
whose active tenant is not one of its own memberships is **refused**: `setSession`
returns `false`, the store keeps the session it had, and `accessSession.start` reports
failure without memoizing the token, so the next `sync` tries again rather than trusting
a session that never was. `SessionFactory` already reconciles a claimed tenant against
the membership list, so the refusal is the store keeping its own invariant rather than
trusting a caller.

Until the session is hydrated the principal is `null`, and `RequireMutation` renders
nothing and records no denial — a false refusal (and a false audit event) would be worse
than a control that appears one frame later.

`useAccess` prefers the value published by `AccessProvider` and falls back to a direct
subscription on the store, so a gated subtree stays reactive even when it is rendered
outside the provider (a test harness, a Storybook story). No consumer can silently go
stale.

## There is no route-level gate

Routes declare **authentication** (`guard: 'protected'`) and nothing else. Authorization is
not a routing concern: a route table cannot know whether the server will return anything for
this principal, and a client-side verdict computed ahead of the request is a second source of
truth that drifts from the first. A page therefore renders, and the controls inside it are
gated one by one — or the page's own data comes back empty and it says so.

`/access-denied` is a plain public route rendering `AccessDenied`, which owns an `h1`, sets
the document title, and moves focus to its heading. It is the destination for a refusal the
page cannot render around; it is **not** a `RequireMutation` fallback.

## Gating UI: the mutation gate

Authorization keys on the name of a GraphQL mutation, matching the team's architecture
(issue #114). It is the **only** gate: there is no permission catalogue, no role → permission
expansion, and no locally computed verdict of any kind.

```typescript
import RequireMutation from '@/components/require-mutation';
import useCanMutate from '@/hooks/use-can-mutate';
import { MUTATION_KEYS } from '@/lib/access/mutation-catalogue';

<RequireMutation mutation={MUTATION_KEYS.createUser}>
  <UIButton onClick={create}>{t('user.create')}</UIButton>
</RequireMutation>;

const canCreate = useCanMutate(MUTATION_KEYS.createUser);
```

A denied affordance is **removed**, not disabled and not `aria-hidden`: it never existed for
this principal, so nothing should announce it. `RequireMutation` deliberately takes no
`fallback` prop.

**Fail-closed by absence.** `Principal.allowedMutations` is empty unless an access source
published it, and `SessionFactory` never populates it from claims, so a deployment that
supplies nothing denies every mutation gate. `RequireMutation` takes **no** fallback: a
key that is absent renders nothing at all, which is the board's "do not show the component
when the data is empty" rule. Until a deployment installs a real resolver, every mutation
gate denies — the intended direction, and the reason a control should be wrapped only when
its set is actually supplied.

**Where the set comes from.** `MutationAccessDispatcher` is the request half of the
board's `checkPermissionRequest` / `checkPermissionResponse` pair, expressed in this
repository's own idiom rather than with RxJS: `request(input)` awaits a
`MutationAccessResolver` and republishes the resolved set onto the live principal through
`accessState.setSession`, which notifies the existing `useSyncExternalStore` subscription —
the watcher half. Because the read stays synchronous and only the request is asynchronous,
first paint never awaits a round trip. The resolver is swapped exactly like the session
loader and the audit sink:

```typescript
mutationAccessDispatcher.useResolver(myResolver);
```

The shipped default, `claimsMutationResolver`, derives the set from the token's own
`allowedMutations` claim so the path is exercisable end to end today. The real GraphQL
resolver arrives with the backend contract in
[`src/api/contracts/access-rbac-proposal.md`](../src/api/contracts/access-rbac-proposal.md).
The `accessCatalogueSource` runtime flag ([`docs/feature-flags.md`](feature-flags.md))
governs **which** resolver a deployment installs — never whether the gate itself works.

**The key set is closed, and checked against the schema.** `MUTATION_KEYS` is the only
place a gate key is named, and `tests/unit/lib/access/mutation-catalogue-parity.test.ts`
fails the build unless every key is a mutation field the pinned GraphQL contract declares.
A server key the catalogue does not declare is dropped by `MutationKeyFilter` and audited
as `access_unknown_mutation`; a catalogue key absent from the server's set simply denies.

## Object-level rules

There are none client-side. _May this principal edit **this** contact_ depends on data the
client does not authoritatively hold, so it is answered where the data lives: the server
returns the row, or it does not. A page whose data comes back empty renders its own empty
or refused state; a control that would invoke a mutation is wrapped in `RequireMutation`.

## Audit

`AuditCore` stamps every event with an ISO timestamp plus the current principal and
tenant, then hands it to the installed `AuditSink`. The default sink drops events;
a deployment installs a real one with `auditCore.useSink(mySink)` at app entry. That
seam is deliberately container-free: the DI graph loads lazily on the first auth
action, so anything wired only during registration would miss every event on a
reload-with-token session. A sink that throws can never break a user flow.

Recorded events: `login`, `logout`, `tenant_switch` (with `from`/`to`),
`sensitive_action` (for a feature's own security-relevant mutations),
`permission_denied` (with the refused `mutation` and the path it was refused on; for a
refused tenant switch, with the `tenantId` and whether the principal was `anonymous` or not
a member), and `access_unknown_mutation` (with `mutations`, the comma-separated mutation
keys an access source granted that `MUTATION_KEYS` does not declare; they are discarded,
one event per read rather than one per key). Every session that ends, including one replaced
by another login, closes with a `logout` event while its principal is still known, so the
trail reconciles into whole sessions.

Every event is stamped from the published principal: a caller cannot supply an attribution
of its own, so an event always names whoever is signed in when it is recorded.

## Extending the model

- **A role** — nothing to add. Roles are opaque server strings carried for display and
  audit; the client neither validates nor interprets them.
- **A mutation key** — add it to the `MutationKey` union
  (`src/lib/types/access/mutation-access.ts`) and to `MUTATION_KEYS`
  (`src/lib/access/mutation-catalogue.ts`). The parity test rejects a key the pinned
  GraphQL contract does not declare as a mutation field, so a key is added when the
  schema pin carries it — never before.
- **An access flag** — add it to the `FeatureFlag` union
  (`src/lib/types/access/feature-flag.ts`), to `FEATURE_FLAGS`, and to
  `FEATURE_FLAG_DEFAULTS` (`src/lib/access/feature-flag-catalog.ts`). The server may
  override a default per session through the `flags` claim; unknown flag keys in the
  claim are ignored. These are **per-principal entitlements** and are a separate
  catalogue from the deployment-level runtime flags of
  [`docs/feature-flags.md`](feature-flags.md), which are read with `useFeatureFlag`, not
  `useAccessFlag` — never declare an access flag as runtime configuration.

## Machine-enforced boundaries

- **dependency-cruiser `no-ui-to-access-services`** — no UI layer (`components`,
  `routes`, `providers`, `features`, `hooks`) may resolve an access service directly;
  they go through the hooks seam, which keeps tsyringe off the paint path.
- **dependency-cruiser `no-ui-to-access-state`** — the UI may not import the state store
  directly: `setSession` / `setActiveTenant` bypass the membership check in
  `switchTenant` and emit no audit event. The exemption names exactly two files —
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
  `principal.roles.includes(…)` / `principal.allowedMutations.includes(…)` outside the
  access layer, and no raw mutation keys at a call site: `useCanMutate('…')`, `can('…')`,
  or `mutation="…"`. A backtick is a quote too, so each of those positions rejects a
  template literal as well as a plain string; an array argument is matched one level deeper
  (`can(['…'])`); and the method itself is matched spelled as an identifier or as a computed
  literal (`gate['can'](…)`), as for the membership methods below. Branching on `roles` is
  banned precisely because a role grants nothing: a `roles.includes('admin')` check is the
  locally computed verdict this model exists to remove.

Satisfy all of them by going through the mutation gate. Never add a suppression, and
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
determined rewrite can still evade any AST matcher, and an `as MutationKey` cast will
launder a literal past the call-site rule. Review is the backstop. The real
enforcement is that the server is authoritative: nothing here decides access, it
only decides what to render.
