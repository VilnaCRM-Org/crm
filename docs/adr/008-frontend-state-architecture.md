# ADR-008: Frontend state architecture: server, client, and session state

- Status: Approved
- Deciders: [@RudoiDmytro](https://github.com/RudoiDmytro)
- Date: 2026-09-17

**Technical Story**: Three state mechanisms were in flight with no rule for which to use when.
`package.json` shipped `zustand`, `CLAUDE.md`, `AGENTS.md` and [ADR-002](./002-zustand-over-redux.md)
called it the canonical store, and `src/` never imported it: the reference store was a
hand-rolled reactive var, server data went through two transports with no written criterion,
and the session contract was implicit. Issue
[#110](https://github.com/VilnaCRM-Org/crm/issues/110) asked for one machine-enforced standard.

## Context and Problem Statement

The auth feature keeps its state in `AuthStateVar`, a class over a dependency-free reactive
var (`ReactiveVarFactory`), read from React through two hand-written `useSyncExternalStore`
hooks — one of which re-armed one-shot listeners after every notification to emulate a
persistent subscription. The documentation promised Zustand `create` + `devtools`. Registration
writes through Apollo (`RegistrationAPI` → `apolloClient.mutate`), login through the REST
`HttpsClient` (`LoginAPI`), and the `InMemoryCache` handed to Apollo is never read. The access
token lives only in memory, but nothing said so on purpose.

For a repository that is the template for every VilnaCRM microservice and is edited by parallel
human and AI contributors, every one of those was a fork in the road that two agents would take
differently while each cited a "correct" source. The standard has to name exactly one answer per
state category and make the wrong answer fail CI.

## Decision Drivers

- The auth page paints before the DI container, `@apollo/client`, `zod` and `tsyringe` load;
  the mobile Lighthouse floor forbids anything on that path that pulls them in.
- Repositories are the only data-access boundary (issue #130); React never sees a transport.
- Instance methods on classes, never free functions, outside React components and hooks
  (issue #100); container-free singletons on the paint path (issue #128).
- The docs, the reference store and the gates must agree, and the contradiction must not be
  able to return unnoticed.
- No migration of existing features in the same change: the standard, the docs and the
  enforcement land here; broad rewrites are follow-ups.

## Considered Options

1. **Adopt Zustand and migrate the auth store to it** — make the docs true by changing the code.
2. **Sanction the reactive-var primitive, promote it to a neutral home, drop Zustand** — make
   the docs true by changing the docs and codifying what the code already does.
3. **Keep both** — Zustand for new stores, the reactive var for auth.

## Decision Outcome

Chosen option: **"Sanction the reactive var, drop Zustand"**. State is exactly one of three
categories, and the category decides the primitive, the owner and the gate:

- **Server state** — owned by the backend and cached by Apollo. Primitive: a repository
  (`@injectable`) over `ApolloClient` (GraphQL) or `HttpsClient` (REST). Read from React through
  a hook that consumes the repository via `useService` — never `useQuery` in a component.
- **Client/UI state** — owned by the browser session. Primitive: a `*Var` class over
  `ReactiveVarFactory` from `src/lib/state/`. Read from React through
  `useReactiveVar(variable, select)`.
- **Session state** — owned by the auth feature. Primitive: `AuthStateVar`, built on the same
  reactive var but its own category, because the token carries a documented persistence
  contract no other store has. Read from React through `useAuthState` / `useAuthToken`.

**Decision rule.** Does the backend own the value? Server state. Otherwise, is it the token or
what the token implies about the user? Session state. Otherwise it is client/UI state. A value
never belongs to two categories: a cached list of contacts is server state even while a filter
over it is client state.

**Artifacts.** `src/lib/state/` holds the primitive — `ReactiveVarState` (listener
bookkeeping), `ReactiveVarFactory` (the `makeVar`-shaped call surface with a persistent
`subscribe`), the `ReactiveVar<T>` contract and the single React bridge `useReactiveVar` —
promoted from the auth feature so the next module can import it without crossing a feature
boundary. `AuthStateVar` composes it as before; `useAuthState` and `useAuthToken` are one-line
selectors over `useReactiveVar`, and the re-arming one-shot listener logic is gone with the
`onNextChange` API nothing else used. `zustand` left `package.json`. The gates:

- ESLint `no-restricted-syntax` (`clientStateSelectors` in `eslint.config.mjs`, every
  `src/**` block): no `zustand` import, and no `useSyncExternalStore` — named or aliased
  import, `React.useSyncExternalStore`, the computed `React['useSyncExternalStore']`, or a
  destructured `{ useSyncExternalStore }` — anywhere but `src/lib/state/use-reactive-var.ts`.
  Must-fail fixtures live in `scripts/ci/eslint-gate-fixtures.mjs`.
- dependency-cruiser `no-apollo-client-outside-data-layer`: `@apollo/client` is
  value-imported only by the repositories layer, a module's `config/di.ts` and the
  observability `ApolloLinkFactory`. `no-shared-ui-to-http-client`: `src/components`,
  `src/hooks`, `src/providers`, `src/routes` and `src/lib` never reach
  `src/services/https-client/` (the thrown `HttpError` stays importable). Both carry rule-rot
  fixtures in `scripts/ci/depcruise-rule-fixtures.mjs`.
- `tests/unit/tooling/state-architecture-contract.test.ts`: `package.json` and `src/` are
  Zustand-free, ADR-002 is superseded, and `CLAUDE.md` / `AGENTS.md` name the reactive var,
  so the guide cannot drift back.

### Server state: transport and cache rules

The transport criterion is the one in
[`src/api/contracts/README.md`](../../src/api/contracts/README.md): GraphQL for the entities
the user-service schema models and their mutations, REST for what the graph does not expose —
session/token exchange, health, files, third-party endpoints. Registration via Apollo and login
via `HttpsClient` satisfy that criterion as written (`login` is a token exchange the schema
does not model), so the split is intentional, not debt.

Caching lives in the module composition root that builds the `ApolloClient`, never at a call
site, and every rule below applies from the first query onward — today no query reads the
cache, and that is recorded here rather than pretended otherwise:

- **Identity**: entities normalize on `id` (Apollo's default `keyFields`); an entity keyed on
  anything else declares `typePolicies` in the module's `config/di.ts`, next to the client.
- **Default `fetchPolicy`**: `cache-first` for queries. A repository method that must observe
  a fresh value passes `network-only` explicitly and says why in its name (`refresh*`).
- **After a mutation**: prefer returning the mutated entity and letting normalization update
  it; `cache.modify` for a list the response cannot express; `refetchQueries` only when the
  server derives something the client cannot. Never `cache.evict` from a component.
- **Errors**: a repository maps transport failures to the typed errors of
  [ADR-007](./007-reliability-model.md); a hook never inspects an Apollo error object.

### Session state: the token contract

- **Storage**: the access token is a field of `AuthStateVar`, in memory only. There is no
  `localStorage`, `sessionStorage` or cookie persistence in `src/`, and adding one is an
  architecture change that needs a new ADR: the token would become readable by any script the
  CSP admits.
- **Lifetime**: the page's. A reload clears it; `ProtectedRoute` redirects to `/sign-in`
  keeping the intended destination in `state.from` (issue #150), and the sign-in page returns
  there on the next null → token transition.
- **Refresh**: none. The user-service contract exposes no refresh endpoint; a `401` on any
  request surfaces as an `AuthError` of kind `auth` on the calling flow, and the parser emits
  the `unauthorized_response` security event (issue #159). Automatic logout on `401` and any
  refresh flow are follow-ups to the runtime-resilience work in issue #147, not silent behavior.
- **Logout**: `authActions.logout()` clears the observability user tag and resets the state
  to `CLEARED_STATE`; nothing else may write `token: null`.
- **Test seed**: the Lighthouse and Playwright suites preload a token through the compile-guarded
  seam in `src/config/env/preloaded-auth-token.ts` (issue #158); it is the only way a token
  enters the state other than a login response.

## Positive Consequences

- One answer per category, checkable in `src/lib/state/`, `config/di.ts` and the gates.
- The reactive var stays dependency-free, so the auth paint path keeps its Lighthouse budget.
- `use-auth-token.ts` shrank from a re-arming listener class to a selector; the primitive is
  reusable by the next module without a copy.
- A zustand import or an ad-hoc subscription fails `make lint`, and a contributor guide that
  drifts back to Zustand fails `make test-unit-all`.

## Negative Consequences

- The primitive is bespoke; a contributor who knows Zustand learns a smaller API instead. The
  API is `variable()`, `variable(next)`, `variable.subscribe(listener)` and one hook. A write
  counts as a change under `Object.is`, the same comparison `useSyncExternalStore` applies to
  snapshots, so a repeated `NaN` is silent and `-0` over `0` notifies.
- `useReactiveVar` memoizes the selected slice on the store value and the selector identity,
  so a selector that builds a derived object cannot loop React; the price is that such a slice
  is recomputed, and its consumer re-rendered, on every store write rather than only when the
  slice changes — the same trade-off `useSyncExternalStoreWithSelector` makes without a custom
  equality function.
- The cache rules govern code that does not exist yet; they will be tested by the first real
  query (issue #123) rather than here.

## Pros and Cons of the Options

### Adopt Zustand and migrate the auth store

#### Good (Adopt Zustand)

- Widely known API, DevTools integration, a growing ecosystem.

#### Bad (Adopt Zustand)

- Rewrites the reference store in the same change the issue says must not migrate features.
- Adds a dependency to the paint path for a capability the reactive var already provides.

### Sanction the reactive var, drop Zustand (chosen)

#### Good (Sanction the reactive var)

- Zero runtime behavior change on the auth page; the docs become true.
- Dependency-free, container-free, and now a neutral `src/lib/state/` import for any module.

#### Bad (Sanction the reactive var)

- Bespoke primitive with no DevTools; every convention is this repository's to document.

### Keep both

#### Good (Keep both)

- No decision to defend.

#### Bad (Keep both)

- Exactly the drift the issue describes: two "blessed" patterns, each defensible in review.

## Links

- [Issue #110: Define frontend state and server-data architecture standard](https://github.com/VilnaCRM-Org/crm/issues/110)
- [ADR-002: Zustand vs Redux for Client State Management](./002-zustand-over-redux.md) —
  superseded by this record
- [ADR-007: Reliability model](./007-reliability-model.md) — the typed error contract that
  repositories map transport failures onto before a hook or boundary sees them
- [Where does my state go?](../state-architecture.md) — the contributor guide
- [`src/api/contracts/README.md`](../../src/api/contracts/README.md) — the transport decision rule
