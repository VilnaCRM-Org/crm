# ADR-004: Client-side access control as a cross-cutting two-layer boundary

- Status: Approved
- Deciders: [@RudoiDmytro](https://github.com/RudoiDmytro)
- Date: 2026-09-07

**Technical Story**: The template authenticated users but had no answer to _what may this
principal do, in which tenant, and what did it just try_. Tracked in
[#114](https://github.com/VilnaCRM-Org/crm/issues/114).

## Context and Problem Statement

Before this change `isAuthenticated` was `!!token` and nothing else. Every route behind
`ProtectedRoute` was equally reachable by every authenticated principal, no component could ask
whether an affordance should be rendered, there was no notion of an active tenant, and a refused
action left no trace. A CRM is multi-tenant by definition, so shipping feature modules on top of
that base would have meant every module inventing its own answer.

Three constraints made the placement non-obvious.

First, the epic proposed `src/modules/access/`. That is **not viable in this repository**:
[`.dependency-cruiser.js`](../../.dependency-cruiser.js) forbids module-to-module imports outright
(`no-cross-module-imports`, which a public barrel does not exempt) and bars shared UI from
importing a module (`no-components-import-modules`). A concern every module and every shared
component must consume therefore cannot live in a module at all.

Second, the authenticated shell is one of the three routes the mobile Lighthouse budget is measured
on (`/`, `/sign-up`, `/sign-in`), and that budget has no headroom — `config/performance-budget.json`
caps the initial entrypoint and [ADR-003](./003-browser-support-matrix.md) already rules out
spending it on polyfills. The auth
store is deliberately container-free for exactly this reason: the DI graph loads behind a dynamic
`import()` on the first auth action. Any authorization check reachable from first paint therefore
must not pull tsyringe, zod, or Apollo into the eager chunk.

Third, there is no roles endpoint. The server issues a signed access token and nothing else, so a
principal can only be derived from that token's claims — which means the client can read a
decision but can never establish it.

## Decision Drivers

- A cross-cutting concern must satisfy the existing dependency-cruiser layer law, not be exempted
  from it
- The authenticated paint path must stay free of tsyringe, zod, and Apollo
  (`raw.maxInitialEntrypointBytes`, and the mobile Lighthouse floor)
- The client must never be mistakable for the authorization boundary; the server stays
  authoritative
- Consistency with the observability boundary (issue #115), which already solved the same
  paint-path problem with a container-free core plus an `@injectable()` adapter
- Repository convention: policy expressed as data and enforced by a machine, not asserted in prose
- Feature modules must consume the layer through a seam narrow enough to be gated, so a future
  module cannot reach past it

## Considered Options

1. **`src/modules/access/` — a feature module like `user`** — the shape the epic proposed.
2. **A single `@injectable()` service layer under `src/services/access/`** — one layer, resolved
   from the container wherever a decision is needed.
3. **A two-layer cross-cutting boundary: `src/lib/access/` (container-free domain and state) plus
   `src/services/access/` (`@injectable()` adapters), consumed by React through hooks** — the
   observability shape.
4. **Fetch a server-computed capability set on boot** — ask the API what this principal may do
   instead of deriving it on the client.

## Decision Outcome

Chosen option: **"A two-layer cross-cutting boundary"**.

[`src/lib/access/`](../../src/lib/access) holds the dependency-free domain and state — the
permission and access-flag catalogues, the role-to-permission resolver, the snapshot store and its
sealing factory, the claims reader, the session factory, and the audit core. It imports nothing
from tsyringe and nothing from a feature module, so it is safe to reach from first paint.
[`src/services/access/`](../../src/services/access) holds the `@injectable()` adapters and the
`ACCESS_TOKENS` composition root (issue #109), which registers the domain singletons with
`useValue` so container-resolved collaborators inject them instead of value-importing them
(issue #130). React consumes the layer only through `src/hooks/use-*` plus `AccessProvider`,
`RequirePermission`, and the `PermissionRoute` route element.

The principal is derived from the access token's claims: unrecognised roles are dropped rather
than coerced, a token with no recognised role falls back to `DEFAULT_ROLE` (`viewer`, the least
privileged), a blank `sub` becomes a random opaque id rather than a shared empty identity, and an
active tenant outside the claimed membership list is reconciled to a real membership rather than
honoured as claimed. The store keeps that invariant separately: a principal handed to `setSession`
whose active tenant is not one of its own memberships is refused rather than published.

Route gating is **route data**, not shell wiring: a route contract declares
`meta: { permission }` and the composer groups protected routes under one `PermissionRoute` per
permission, which keeps the module-owned route registry of issue #105 intact.

Six dependency-cruiser rules and a set of ESLint `no-restricted-syntax` selectors make the
boundary machine-enforced rather than conventional — UI may not resolve an access service or the
state store directly, the paint-safe domain may not import tsyringe or the container, the access
layer may not import a feature module, and no call site outside the layer may test
`principal.roles` / `principal.permissions` membership or pass a raw permission string. The full
inventory, including the known limits of a syntactic guardrail, is in
[`docs/access-control.md`](../access-control.md).

## Positive Consequences

- A cross-cutting concern exists that every module can consume without violating the layer law,
  so feature modules inherit authorization instead of reinventing it
- The authenticated shell still paints without tsyringe: the measured async-chunk move for the 403
  panel confirmed the code-split boundary holds
- Substitution is real, not nominal — `accessSession.useLoader` and
  `ACCESS_TOKENS.SessionRepository` redirect both the render path and the DI path with one change,
  so a future roles endpoint is a loader swap rather than a rewrite
- Denials are observable: every refused navigation, tenant switch and policy evaluation emits a
  `permission_denied` audit event — a hidden affordance does not, because nothing was attempted —
  and every session that ends closes with a `logout` while its principal is still known
- The boundary is enforced by gates that fail closed, so an innocent import cannot undo the split

## Negative Consequences

- The layer is a **UX mirror of the server's decision, never a security boundary**. A tampered
  token buys a misleading UI and nothing more, but the distinction has to be understood by every
  contributor; the doc states it and this ADR restates it deliberately
- Roles and permissions are duplicated between server and client until a capability endpoint
  exists. `ROLE_PERMISSIONS` can drift from the server's model, and only a real request failing
  will reveal it
- Two layers cost more ceremony than one: adding a collaborator means a token, a registration, and
  an adapter, and the container-free half must stay container-free by hand and by gate
- The ESLint call-site rules are syntactic. An `as Permission` cast launders a literal past them,
  so review remains the backstop

## Pros and Cons of the Options

### Option 1

Put the layer in `src/modules/access/`, as the epic proposed.

#### Good (Option 1)

- Matches the folder shape contributors already know from `src/modules/user`

#### Bad (Option 1)

- Structurally impossible here: `no-cross-module-imports` and `no-components-import-modules` would
  reject every consumer, and the only way to adopt it is to weaken the two rules that keep modules
  independent

### Option 2

One `@injectable()` service layer under `src/services/access/`.

#### Good (Option 2)

- One layer, one mental model, every collaborator injectable by default

#### Bad (Option 2)

- Any authorization check reachable from first paint pulls tsyringe into the eager chunk, against
  the budget the auth store was already restructured to protect
- `ProtectedRoute` and the route composer run before the container is ever imported, so the gate
  would have to await the DI graph and paint an empty frame first

### Option 3

Container-free domain plus injectable adapters, consumed through hooks.

#### Good (Option 3)

- Keeps the paint path free of the container while still making every collaborator substitutable
- Reuses a shape the repository has already validated for observability (issue #115)

#### Bad (Option 3)

- Two homes for one concern, and the split has to be defended by gates rather than by taste

### Option 4

Fetch a server-computed capability set on boot.

#### Good (Option 4)

- No duplicated permission model, and the server stays the single source of truth in fact as well
  as in principle

#### Bad (Option 4)

- No such endpoint exists in user-service today
- The request is not preload-scanner-discoverable, so awaiting it before the first render puts a
  round trip on the critical path of the audited route — the same reasoning that made runtime
  configuration an inline block rather than a fetch
  ([`src/config/runtime/README.md`](../../src/config/runtime/README.md))

## Links

- [Issue #114: client-side RBAC, tenancy, access flags, and audit](https://github.com/VilnaCRM-Org/crm/issues/114)
- [Access control: authorization, tenancy, access flags, audit](../access-control.md)
- [ADR-003: Browser support matrix and polyfill strategy](./003-browser-support-matrix.md)
- [Runtime configuration and feature flags](../../src/config/runtime/README.md)
- [Feature flags: lifecycle and rollout](../feature-flags.md)
