# ADR-002: Zustand vs Redux for Client State Management

- Status: Approved

- Deciders: @kravalg

- Date: 2026-01-22

## Context and Problem Statement

The CRM front-end team has introduced Apollo Client for GraphQL server state management.
Redux Toolkit now only manages client-side state (UI state, form state, user preferences),
making its complex patterns (actions, reducers, selectors, thunks) excessive for our needs.

How can we simplify client state management while maintaining compatibility with our
Module Federation architecture?

## Decision Drivers

1. Reduced boilerplate for simple client-only state
2. Smaller bundle size impact on micro frontend performance
3. Compatibility with Module Federation (singleton-friendly, no providers)
4. Developer experience and TypeScript support
5. Learning curve for team onboarding
6. Integration with existing Apollo Client setup
7. Long-term maintainability and ecosystem support

## Considered Options

1. **Redux Toolkit** - Continue with current setup
2. **Zustand** - Minimal, hook-based state management
3. **Jotai** - Atomic state management
4. **MobX** - Observable-based state management

## Decision Outcome

**Chosen option: Zustand**, because it enables minimal boilerplate state management with
excellent Module Federation compatibility, while Apollo Client handles all server state
concerns.

### Positive Consequences

- Independent store creation without providers (ideal for Module Federation)
- ~95% reduction in state management boilerplate
- Smaller bundle impact (~2KB vs ~10–14KB for Redux Toolkit + react-redux)
  (as of 2026-01, measured via [Bundlephobia: zustand][zst] and
  [Bundlephobia: @reduxjs/toolkit][rtk] + [react-redux][rr])
- Excellent TypeScript inference without extra annotations
- Redux DevTools compatibility for debugging
- Optional middleware for persistence and immer (require separate setup; immer requires the
  'immer' package)

### Negative Consequences

- Migration effort required for existing Redux code
- Smaller ecosystem compared to Redux
- Team needs to establish conventions (less opinionated)
- Fewer middleware options available

## Comparison of Options

| Aspect            | Redux Toolkit            | Zustand      | Jotai        | MobX          |
| ----------------- | ------------------------ | ------------ | ------------ | ------------- |
| Bundle Size       | ~10–14KB ([rtk], [rr])   | ~2KB ([zst]) | ~3KB ([jot]) | ~15KB ([mbx]) |
| Boilerplate       | High (actions, reducers) | Minimal      | Minimal      | Moderate      |
| Provider Required | Yes                      | No           | Optional     | Yes           |
| Module Federation | Needs config             | Native       | Needs config | Needs config  |
| TypeScript        | Good (needs setup)       | Excellent    | Good         | Good          |
| DevTools          | Native                   | Compatible   | Limited      | Separate      |
| Learning Curve    | Steep                    | Low          | Moderate     | Moderate      |
| Ecosystem         | Very large               | Growing      | Small        | Large         |

## Follow-up Actions

- **Done** — Migrate existing Redux state to Zustand, tracked in
  [#45 Migrate authentication state management from Redux to Zustand](https://github.com/VilnaCRM-Org/crm/issues/45).
  Issue #45 is closed and the migration is complete: `package.json` declares no `redux` or
  `@reduxjs` dependency, and no Redux primitive (`createSlice`, `configureStore`) remains in
  `src/`. Auth state now lives in `src/modules/user/features/auth/stores/`.

## Current rules

Zustand holds client/UI state and the session token again (issue
[#334](https://github.com/VilnaCRM-Org/crm/issues/334)). State is exactly one of three
categories, and the category decides the primitive:

- **Server state** — owned by the backend. A repository (`@injectable`) over `ApolloClient`
  (GraphQL) or `HttpsClient` (REST), read from React through a hook that consumes it via
  `useService`; never `useQuery` in a component. The transport rule is in
  [`src/api/contracts/README.md`](../../src/api/contracts/README.md).
- **Client/UI state** — a Zustand store created with `create<State>()(…)` in a
  `use-*-store.ts` hook file (`useConnectivityStore` in `src/lib/connectivity/`), read through a
  selector and written with `setState(patch)`. No logic lives in the store.
- **Session state** — `useAuthStore` in `src/modules/user/features/auth/stores/`, read through
  `useAuthState` / `useAuthToken`. `AuthStoreActions` receives it by value under
  `AUTH_TOKENS.AuthStore` (`StoreApi<AuthState>`), so the paint path stays container-free.

**No middleware.** `persist`, `devtools`, `immer` and every other `zustand/*` subpath are
rejected: the access token is memory-only (a reload clears it, `authActions.logout()` writes
`CLEARED_AUTH_STATE`), and the rest add bytes the stores do not need. `zustand` is imported only
from its root specifier. The preloaded-auth-token seed is read once inside the auth store
initializer, so the seed-gate invariants hold. `useSyncExternalStore` stays banned in `src`:
Zustand calls it inside `node_modules`. `docs/state-architecture.md` is the contributor guide,
and `tests/unit/tooling/state-architecture-contract.test.ts` pins these rules.

## Update history

- **2026-10-12** — **Approved again** for
  [#334](https://github.com/VilnaCRM-Org/crm/issues/334). The bespoke reactive var that replaced
  the Zustand store in September is retired, and the stores above are the client-state
  primitive. The ADRs numbered 003 and later were removed from the repository at the same time;
  the rules they carried for state live in "Current rules" above.
- **2026-09-17** — **Superseded** ([#110](https://github.com/VilnaCRM-Org/crm/issues/110)) by a
  since-removed record. The Redux → Zustand migration
  this record decided did happen ([#46](https://github.com/VilnaCRM-Org/crm/pull/46)), but the
  Zustand store it produced was replaced weeks later by an Apollo `makeVar`-shaped reactive var
  when registration moved to GraphQL ([#42](https://github.com/VilnaCRM-Org/crm/pull/42)), and
  that var was then made dependency-free to keep `@apollo/client` off the auth page's paint
  path. From that point `zustand` shipped in `package.json` without a single import in `src/`,
  while this ADR, `CLAUDE.md` and `AGENTS.md` still named it the canonical store. The Module
  Federation premise never held either: the packages are installed but `rsbuild.config.ts`
  registers no plugin, and a unit test asserts it stays that way. That record sanctioned the
  reactive var as the one client/UI-state primitive, removed `zustand`, and added the gates
  that keep the docs and the code agreeing. The comparison table above is kept as the
  historical evaluation.
- **2026-08-13** — Marked the follow-up Done. It had continued to present completed work as
  pending. Recorded while adding the documentation drift gates in
  [#122](https://github.com/VilnaCRM-Org/crm/issues/122).

## Links

- [Zustand Documentation](https://docs.pmnd.rs/zustand/getting-started/introduction)
- [Zustand GitHub](https://github.com/pmndrs/zustand)
- [Zustand vs Redux Comparison](https://docs.pmnd.rs/zustand/getting-started/comparison)
- [ADR-001: Module Federation vs Single-SPA](./001-module-federation-vs-single-spa.md)

[zst]: https://bundlephobia.com/package/zustand
[rtk]: https://bundlephobia.com/package/@reduxjs/toolkit
[rr]: https://bundlephobia.com/package/react-redux
[jot]: https://bundlephobia.com/package/jotai
[mbx]: https://bundlephobia.com/package/mobx
