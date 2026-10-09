# ADR-023: Zustand stores hold client and session state

- Status: Approved
- Deciders: [@kravalg](https://github.com/kravalg)
- Date: 2026-10-09

**Technical Story**: [ADR-008](./008-frontend-state-architecture.md) sanctioned a bespoke reactive
var and banned Zustand, and the next three features (#315, #330, #331) write client state against
it. Issue [#334](https://github.com/VilnaCRM-Org/crm/issues/334) replaces the reactive var with
Zustand stores before they do, with no visible behaviour change.

## Context and Problem Statement

Client and session state live in `AuthStateVar` and `ConnectivityStateVar`, classes over
`ReactiveVarFactory` in `src/lib/state/`, read from React through `useReactiveVar`, the one
sanctioned `useSyncExternalStore` bridge. The primitive works, but it is a smaller, bespoke API
than the one contributors and AI agents already know, it has no tooling around it, and every
convention that Zustand ships with has to be written and defended in this repository.

The ban on Zustand rested on a paint-path argument: the auth page paints before the DI container,
`@apollo/client`, `zod` and `tsyringe` load. Measured on the package, `zustand@5.0.15` adds under
1 kB raw to the eager entrypoint and depends on none of those. Apollo, not Zustand, was the cost
that argument was protecting the paint path from.

The decision is the user's: client state is Zustand. This record carries ADR-008's server-state
and session-token rules forward unchanged and replaces only the client/UI and session primitive.

## Decision Drivers

- The auth page paints before the DI container, `@apollo/client`, `zod` and `tsyringe` load; the
  mobile Lighthouse floor and the raw and gzip byte budgets forbid pulling them in.
- The access token is memory-only, so the store must not persist.
- Instance methods on classes, never free functions, outside React components and hooks
  (issues #100, #129, #130); a store in a `use-*.ts` hook file is already exempt from those gates.
- The preloaded-auth-token seed must stay compiled out of every deployable bundle (issue #158).
- Typed boundaries: every layer edge names its type (`AuthState`, `AuthStatePatch`,
  `StoreApi<AuthState>`, `ConnectivityState`).
- No behaviour change: same renders, same writes, same Lighthouse, visual and mutation results.

## Considered Options

1. **Zustand `create`, no middleware** — one hook per store, read through selectors, written with
   `setState`.
2. **Keep the reactive var** — leave ADR-008's primitive and its bridge as they are.
3. **Zustand vanilla `createStore` with a hand-written React bridge** — the library's core without
   its React binding.

## Decision Outcome

Chosen option: **"Zustand `create`, no middleware"**, because it replaces a bespoke primitive with
the library contributors already know, adds no dependency to the paint path, and keeps every other
rule of ADR-008 intact. State is exactly one of three categories, and the category decides the
primitive, the owner and the gate:

- **Server state** — owned by the backend and cached by Apollo. Primitive: a repository
  (`@injectable`) over `ApolloClient` (GraphQL) or `HttpsClient` (REST). Read from React through a
  hook that consumes the repository via `useService` — never `useQuery` in a component.
- **Client/UI state** — owned by the browser session. Primitive: a Zustand store created with
  `create<State>()(…)` in a `use-*-store.ts` hook file, for example `useConnectivityStore` in
  `src/lib/connectivity/`. Read from React through a selector, `useStore((s) => s.field)`; written
  with `useStore.setState(patch)`.
- **Session state** — owned by the auth feature. Primitive: `useAuthStore` in
  `src/modules/user/features/auth/stores/use-auth-store.ts`, its own category because the token
  carries a documented persistence contract no other store has. Read through `useAuthState` and
  `useAuthToken`, which are selectors over the store.

**Decision rule.** Does the backend own the value? Server state. Otherwise, is it the token or what
the token implies about the user? Session state. Otherwise it is client/UI state. A value never
belongs to two categories.

**Store shape.** `create` only, with no logic in the initializer beyond the initial value. A
selector returns a field or the stable state object, never a fresh object, so Zustand v5 needs no
`useShallow`. Writers hand the store a named patch type (`AuthStatePatch`, `Partial<AuthState>`).
Behavioural collaborators never import the store: `useAuthStore` is registered by value under the
DI token `AUTH_TOKENS.AuthStore`, typed `StoreApi<AuthState>`, and `AuthStoreActions` receives it
by `@inject`. The auth store stays container-free on the paint path, so the composition root, not
the store, touches `tsyringe`.

**No middleware.** `persist`, `devtools`, `immer`, `subscribeWithSelector` and every other
`zustand/*` subpath are rejected, not deferred. `persist` would write the token to
`localStorage` or `sessionStorage`, which ADR-008 forbids; the rest add bytes and behaviour the
stores do not need. `zustand` is imported only from its root specifier, and a change that needs
middleware needs a new ADR.

### Server state: transport and cache rules

Carried forward from ADR-008 unchanged. The transport criterion is the one in
[`src/api/contracts/README.md`](../../src/api/contracts/README.md): GraphQL for the entities the
user-service schema models and their mutations, REST for what the graph does not expose —
session/token exchange, health, files, third-party endpoints. Caching lives in the module
composition root that builds the `ApolloClient`, never at a call site:

- **Identity**: entities normalize on `id`; an entity keyed on anything else declares
  `typePolicies` in the module's `config/di.ts`.
- **Default `fetchPolicy`**: `cache-first` for queries; a repository method that must observe a
  fresh value passes `network-only` and says why in its name (`refresh*`).
- **After a mutation**: prefer returning the mutated entity; `cache.modify` for a list the
  response cannot express; `refetchQueries` only when the server derives something the client
  cannot. Never `cache.evict` from a component.
- **Errors**: a repository maps transport failures to the typed errors of
  [ADR-007](./007-reliability-model.md); a hook never inspects an Apollo error object.

### Session state: the token contract

- **Storage**: the access token is a field of the auth store, in memory only. There is no
  `localStorage`, `sessionStorage` or cookie persistence in `src/`, and adding one is an
  architecture change that needs a new ADR.
- **Lifetime**: the page's. A reload clears it; `ProtectedRoute` redirects to `/sign-in` keeping
  the intended destination in `state.from` (issue #150).
- **Refresh**: none. The user-service contract exposes no refresh endpoint; a `401` surfaces as an
  `AuthError` of kind `auth` and the parser emits the `unauthorized_response` security event
  (issue #159).
- **Logout**: `authActions.logout()` clears the observability user tag and writes
  `CLEARED_AUTH_STATE` to the store; nothing else may write `token: null`.
- **Test seed**: the Lighthouse and Playwright suites preload a token through the compile-guarded
  seam in `src/config/env/preloaded-auth-token.ts` (issue #158). The store calls
  `preloadedAuthTokenSeed.read()` once, inside its initializer, and names neither the window key
  nor the token variable, so the guard and both reads stay in that one method.

### Gates

- ESLint `no-restricted-syntax` (`clientStateSelectors` in `eslint.config.mjs`, every `src/**`
  block): `useSyncExternalStore` — named or aliased import, `React.useSyncExternalStore`, the
  computed `React['useSyncExternalStore']`, or a destructured property — is rejected everywhere in
  `src`. Zustand calls it inside `node_modules`, which ESLint never lints, so no file is exempt.
  The `zustand` import ban of ADR-008 is lifted.
- dependency-cruiser `no-apollo-client-outside-data-layer` and `no-shared-ui-to-http-client`
  continue unchanged from ADR-008.
- `tests/unit/tooling/state-architecture-contract.test.ts` pins this record: `zustand` is a
  production dependency imported only from its root specifier, the reactive-var files are gone,
  and the contributor guides name `useAuthStore`.

## Positive Consequences

- One widely known API for client and session state, with selectors that re-render a consumer only
  when its slice changes.
- `src/lib/state/`, `AuthStateVar` and `ConnectivityStateVar` are deleted, along with the one
  sanctioned `useSyncExternalStore` bridge and its ESLint exemption block.
- The paint path stays container-free and the eager entrypoint grows by under 1 kB raw.

## Negative Consequences

- `zustand` is a new production dependency to keep patched; the Dependabot lanes and the
  supply-chain gates cover it like any other.
- Zustand does not catch a throwing listener, as `ReactiveVarState.safeNotify` did. The only
  listeners are React's own `useSyncExternalStore` callbacks, which do not throw.
- A write of an equal value is no longer short-circuited by the store; a selector returning the
  same value re-renders nothing, so the observable behaviour is unchanged.

## Pros and Cons of the Options

### Zustand `create`, no middleware (chosen)

Adopt the library's React binding with no middleware.

#### Good (Zustand `create`)

- Familiar API, a small and measured cost, no hand-written subscription logic to maintain.
- Selector-scoped re-renders replace the bespoke memoizing bridge.

#### Bad (Zustand `create`)

- A third-party dependency on the paint path, bounded by the byte budgets and the bundle gates.

### Keep the reactive var

Leave ADR-008's primitive and bridge in place.

#### Good (Keep the reactive var)

- No migration; dependency-free.

#### Bad (Keep the reactive var)

- Every convention is this repository's to write and defend, and #315, #330 and #331 would write
  against a primitive the maintainers have decided to retire.

### Zustand vanilla `createStore` with a hand-written bridge

Use the library core and write the React subscription ourselves.

#### Good (vanilla `createStore`)

- Smallest possible footprint.

#### Bad (vanilla `createStore`)

- Keeps a hand-written `useSyncExternalStore` bridge and its lint exemption for a saving of a few
  hundred bytes.

## Links

- [Issue #334: Zustand for client state](https://github.com/VilnaCRM-Org/crm/issues/334)
- [ADR-008: Frontend state architecture](./008-frontend-state-architecture.md) — superseded by
  this record
- [ADR-002: Zustand vs Redux for Client State Management](./002-zustand-over-redux.md) —
  superseded earlier by ADR-008
- [ADR-007: Reliability model](./007-reliability-model.md) — the typed error contract
  repositories map transport failures onto
- [Where does my state go?](../state-architecture.md) — the contributor guide
- [`src/api/contracts/README.md`](../../src/api/contracts/README.md) — the transport decision rule
