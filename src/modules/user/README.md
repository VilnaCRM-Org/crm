# `user` module

Auth, registration, 2FA, and profile for VilnaCRM. This document is the
**public API contract** for the module: what other modules and the app shell
may import, and how the boundary is machine-enforced (issue #107).

## Public API

Code outside a boundary imports the `user` module **only** through a public
barrel — never a deep internal path.

### Module barrel — `@/modules/user` (`src/modules/user/index.ts`)

- `ApiError` — the module's public error type (consumed by the shared
  `error-parser`).
- `AuthRepository` (type) — the public repository interface.
- `LoginResponse`, `SafeUserInfo` (types) — public response shapes.

Two deliberate deviations from the issue's illustrative example, both forced by
this codebase:

- **Route entry components stay out of the barrel.** The issue example shows
  `Authentication` / `ProtectedRoute` here, but the feature owns its routes
  through its `routes/index` **route contract** (`@auth/routes`), which
  **code-splits** the page entries (`load: () => import('./sign-up|sign-in')`);
  the app-shell registry consumes that contract and the composer imports the
  `protected-route` guard directly. Re-exporting components from this barrel
  would (a) defeat lazy-loading (the auth page's mobile Lighthouse budget) and
  (b) pull React into every consumer of the barrel — including the plain
  `error-parser` util. They remain the documented router-only exception below.
- **The feature interface/response types are re-exported by their leaf type
  paths, not through the `@auth` barrel.** The `@auth` barrel re-exports
  `AuthErrorHandler`, whose implementation imports `error-parser`, which imports
  this barrel for `ApiError`; routing the module barrel through `@auth` therefore
  forms a `module ↔ feature` cycle (`no-circular`, verified). The module root
  `index` is the module's sanctioned composition point (`no-feature-internal-imports`
  intentionally exempts it), so it re-exports the feature's **leaf type files**
  directly — matching the issue's own example.

### Feature barrel — `@auth` (`src/modules/user/features/auth/index.ts`)

- `LoginResponseSchema`, `RegistrationResponseSchema` — response validators.
- `AuthErrorHandler` (type) — the injected error-handler type; the concrete
  class is DI-wired, not exported as a value.
- `LoginResponse`, `RegistrationResponse`, `SafeUserInfo` (types).

Everything else is **private** to the module and must not cross the boundary:
`repositories/*-impl.ts`, `store/*-mapper.ts`, the `lib/api-errors/*`
subclasses, factories, and every file under `types/**` and `utils/**`.

## Two sanctioned exceptions

Both are narrow, documented, and enforced by dependency-cruiser — not a
free-for-all.

1. **DI composition roots** (issue #109) — the thin aggregator
   (`src/config/dependency-injection-config.ts`) holds no registrations; it
   collects the per-module / per-infra registrars. The **user-module root**
   (`src/modules/user/config/di.ts`) wires this module's concrete
   implementations (Apollo, auth repositories, mappers, auth utils) into the
   tsyringe container against its own token module
   (`src/modules/user/config/tokens.ts`, `AUTH_TOKENS`) and may deep-import
   them. The impls stay private to everyone else.
2. **App-shell router** (`src/routes/`) mounts the feature through its
   module-owned **route contract barrel** (`@auth/routes` →
   `features/auth/routes/index`), which lazy-`load`s the page entries, plus the
   `protected-route` guard (resolved by the composer for `guard: 'protected'`).
   The router may reach a feature **only** through that `routes/index` contract
   and the guard — deep-importing a page (`@auth/routes/sign-up`) is forbidden.
   A single eager barrel would pull the whole feature into one chunk and defeat
   lazy-loading (the auth page's mobile Lighthouse budget), so the pages stay
   `import()`-split inside the contract. Governed by
   `no-routes-import-feature-internals` (issue #105); see `src/routes/README.md`.

## Sign-out through the protected outlet context (issue #106)

The module barrel cannot export `authActions` (it would close a `no-circular`
cycle and break barrel purity), and code outside the module may not import
`@auth/stores`. The sign-out action therefore reaches protected pages through
react-router **outlet context**: `ProtectedRoute` renders
`<Outlet context={{ signOut }} />` typed as `ProtectedOutletContext`
(`src/routes/types/protected-outlet-context.ts`), and `AppLayout` forwards it.

`signOut` comes from the `useSignOut` hook (`stores/use-sign-out.ts`). It loads
`@auth/stores` with a **dynamic** `import()` through a `ChunkRetryLoader`, so
the eager entrypoint does not grow, and calls `authActions.logout()` on the
singleton. A final load failure is reported through `observabilityCore` with
`source: 'auth:sign-out'` and leaves the user on the protected page, where the
button can be pressed again. This failure is deliberately silent (accepted in
the approved design: no live region on the page), and there is no busy state
while the chunk loads; surfacing either is a design-owner follow-up. Once the
token is cleared, the guard redirects to `/sign-in` with
`state.focusMain: true` — set only after a sign-out, never for an
unauthenticated visit — and `AuthPageLayout` moves focus to its `<main>` once,
through the same `useArrivalFocus` hook (`src/hooks/use-arrival-focus.ts`) that
`AppLayout` uses after a login. The hook then replaces the entry's state with
`focusMain: false` (keeping `from`), so returning to that entry with Back never
moves focus again, even though `AuthPageLayout` remounts with every auth page.

## Password recovery decisions

The durable decisions of the password recovery flow
([issue #315](https://github.com/VilnaCRM-Org/crm/issues/315)). They live here rather than in
an ADR by the maintainer's decision, and each one states its context, the decision and the
options it rejected. The full design is
[the password recovery architecture](../../../specs/create-new-password/planning-artifacts/architecture-create-new-password-2026-10-05.md).

### Layers follow the Miro board

**Context.** The board's User/Auth frame draws a root page component, React hooks, a
`[Data provider]`, `[Transformer]`s and a `[Repository]`; it draws no frontend controller or
service. The auth tree cannot reach `@/providers/di` (the paint-path carve-out).

**Decision.** A root page `[component]<route>` renders React hooks built on the shared
`useAbortableSubmit`. The hooks reach the Data provider `PasswordRecoveryProvider` through one
container-free `AuthProviderLoader` in `@auth/stores/index.ts`. The provider calls the Repository
`GraphQLPasswordRecoveryRepository` and hands every result to two Transformers:
`UserServiceErrorTransformer` (module-shared, GraphQL failure → `UserServiceFailure`) and
`PasswordRecoveryTransformer` (failure or success → recovery outcome). Data providers live in
`features/<f>/data-providers/` and Transformers in `features/<f>/transformers/`; both folders
are in `config/module-shape.json`, the DI-collaborator gate and the component gate
`components-no-direct-injectable-import`.

**Rejected.** Controller and service classes (not on the board); a proxy, a factory and an
interface per flow (one implementation needs none of them); error translation inside the
repository (the board puts it on the Data provider ⇄ Transformer edge).

### GraphQL through the container's Apollo client

**Context.** Both steps are user-service GraphQL mutations. The variables carry an e-mail, a
reset token and a new password, and the process-wide `InMemoryCache` would keep them.

**Decision.** The repository calls the container's `AUTH_TOKENS.ApolloClient` with two
generated documents, `RequestPasswordReset` and `ConfirmPasswordReset`, each selecting only
`clientMutationId`, with `fetchPolicy: 'no-cache'`. The link chain gains no retry link: a reset
request sends an e-mail and a confirm consumes a token, so a retry is user-initiated only. Both
methods resolve `void` whatever the payload.

**Rejected.** REST transport (the user-service contract for these steps is GraphQL); the
default cache policy (it writes the token and password under `ROOT_MUTATION`); a transport retry
(duplicate side effects); selecting `user` (nothing identifying is needed).

### Failures are classified in two steps

**Context.** user-service answers an input violation with `<property>: <reason>` and
`extensions.status` 422, a domain refusal with a bare translated message and no code, and an
endpoint limiter with HTTP 429.

**Decision.** `UserServiceErrorTransformer.normalize` classifies by shape first — abort, network
status, a violated input property prefix, a numeric `extensions.status`, any other message as a
refusal, otherwise unknown — and `PasswordRecoveryTransformer.fromFailure` then maps that failure
by step (`request` or `confirm`) to one recovery outcome through a data table. No step reads a
translated message for meaning.

**Rejected.** Classification by message text (translated, unstable); one transformer per
operation (#330 and #331 reuse the shape step and append rows only).

### One request outcome for every address

**Context.** A reset request must not tell an attacker whether an address has an account.

**Decision.** Every resolved request becomes the same `RecoverySentOutcome` with the masked
address; only an invalid e-mail, the per-address rate limit, a network or a server failure
differ, and none of those depends on the account existing.

**Rejected.** A "no such account" message (account enumeration).

### Pending schema extension until user-service releases the mutations

**Context.** user-service declares both mutations on `main` only; the pinned contract v2.8.0
has neither.

**Decision.** The declarations are copied verbatim from user-service `main` into one pending
extension under `src/api/contracts/` that codegen and the stateless local Apollo mock read (see
[the contracts guide](../../api/contracts/README.md)). The follow-up contract pin bump to the
first release that declares them deletes the extension and its wiring.

**Rejected.** Waiting for a release (blocks the feature); a commit-SHA pin (the pin check needs
equal `vX.Y.Z` tags); a self-expiring checker (a manual follow-up deletion is simpler).

### The reset token stays in memory

**Context.** The reset link carries a credential in its query string.

**Decision.** `useResetToken` reads the `token` parameter once, keeps it only in memory, and
strips it from the URL with a `replace` navigation in a layout effect before the form paints. No
input renders it, and it never reaches the cache, the history or telemetry.

**Rejected.** Keeping the token in the URL or in storage (history, referrers, logs).

### One shared password policy

**Context.** The new password must satisfy the same policy as sign-up, and the live rule list
must not drift from the validator.

**Decision.** The shared `PasswordValidator` enforces the policy and exposes the rule results
the live list renders; it is never weaker than the API.

**Rejected.** A second recovery-only policy; a policy copied rule for rule from the API.

### Both routes are public

**Context.** A signed-in user may still follow a reset link.

**Decision.** Both recovery routes use `guard: 'public'`; neither redirects a signed-in user nor
touches `useAuthStore`.

**Rejected.** Redirecting signed-in users away (breaks a link opened in a signed-in browser).

### No feature flag

**Context.** The planning bundle kept a `forgotPassword` flag `false` by default and enabled it
in the test stack after the route registration. Issue #309 has since removed that flag: the
sign-in "Забули пароль?" link renders unconditionally and points at
`ROUTE_PATHS.passwordRecovery`.

**Decision.** The flow ships without a flag; registering the route contract is what makes the
link land on the recovery page instead of the not-found page.

**Rejected.** Re-introducing the flag (it would gate a link that already ships, see
[the feature-flag lifecycle](../../../docs/feature-flags.md)).

### Domain Outcome

**Context.** The board's User module draws `UserEntity` and its DTOs, and the business rules
live in user-service.

**Decision.** `UserEntity` and the DTOs (`SignInDto`, `SignUpDto`, `RestorePasswordDto`,
`CreateNewPasswordDto`) are data-only interfaces in `src/modules/user/types/user/`, exported
from the module barrel. `RestorePasswordDto` is the forgotten-password request;
`LoginUserDto` and `RegisterUserDto` become `SignInDto` and `SignUpDto`, and the forms are typed
by the DTOs.

**Rejected.** Per-feature DTO copies; a parallel `*FormValues` copy of each DTO; behaviour or
validation on the domain types.

### Upstream requests

The flow depends on user-service for three things: a reset link host on the SPA origin, a
release tag that declares both mutations, and (optionally) a machine-readable code on GraphQL
errors. The GraphQL limiter gaps are tracked upstream in
[user-service #462](https://github.com/VilnaCRM-Org/user-service/issues/462),
[#469](https://github.com/VilnaCRM-Org/user-service/issues/469) and
[#470](https://github.com/VilnaCRM-Org/user-service/issues/470).

## Enforcement

`make lint` runs all three gates; fix a violation by routing through the
barrel, never with a suppression.

- **dependency-cruiser** `no-module-internal-imports` — outside-module code may
  reach a module only through its `index`.
- **dependency-cruiser** `no-feature-internal-imports` — module-level
  `store` / `types` / `lib` / `hooks` / `utils` / `config` may reach a feature
  only through its `index` (except the module DI composition root
  `config/di.ts`, which wires the feature's internals — issue #109).
- **ESLint** `no-restricted-imports` — a fast in-editor signal that blocks deep
  imports under `@/modules/*/*` and `@auth/*/*` from outside the boundary.

dependency-cruiser is the authoritative graph-level gate; ESLint is the fast
signal. Neither may be weakened to pass.

## Adding a compliant module or feature

Generate it — `make new-module name=<m> feature=<f>` (or `make new-feature
module=<m> feature=<f>`) emits the folders, barrels, DI wiring, i18n pair and
test skeletons already compliant with every gate. The folder law and the full
file list live in [`docs/scaffolding.md`](../../../docs/scaffolding.md).

The barrel rules the generator follows, and that you must keep following as the
module grows:

1. Keep the barrel(s): `src/modules/<m>/index.ts` (module) and the feature entry
   `src/modules/<m>/features/<f>/index.*`. This feature uses a re-export barrel
   (`index.ts`); a generated feature ships an entry component (`index.tsx`) that
   the route contract lazy-loads. Either way it is the **only** path in, so expose
   only what must cross the boundary — if you are unsure, it is private.
2. Keep the barrel lean and one-way (module `index` → feature internals) so
   `no-circular` stays green. Export a service's **type** and DI-wire its class
   when only the type crosses the boundary.
3. Import across the boundary through the barrel. For a deeply nested feature,
   add a bare alias like `@auth` in `tsconfig.paths.json`, `jest.config.ts`,
   and `rsbuild.config.ts`.
4. Run `make lint-deps` and iterate until green. Never weaken a rule.
