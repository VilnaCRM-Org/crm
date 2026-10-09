---
status: complete
workflowType: prd
project_name: crm
date: 2026-10-08
feature: zustand-client-state
issue: 334
author: 'pm (John), autonomous run'
inputDocuments:
  - crm-worktrees/_planning-shared/miro-layer-contract.md (§2.3, §3.4)
  - docs/adr/008-frontend-state-architecture.md
  - docs/adr/002-zustand-over-redux.md
  - docs/state-architecture.md
  - src/lib/state/*, src/lib/connectivity/*
  - src/modules/user/features/auth/stores/*
  - src/config/env/preloaded-auth-token.ts
  - eslint.config.mjs (clientStateSelectors, the use-reactive-var.ts block)
  - tests/unit/tooling/state-architecture-contract.test.ts
  - config/performance-budget.json
  - git history eaab4638 (#46), c53defc0 (#44), da898d7f (#42), 8b159be2 (#279)
---

# PRD: Zustand for client state (chore)

**Author:** BMad (Product Manager) **Date:** 2026-10-08 **Feature:** `zustand-client-state`

## 1. Overview

On 2026-10-08 the user asked to "change the react state var to zustand". ADR-008 (issue #110)
had removed Zustand and banned it in ESLint. Told this, the user chose a separate prerequisite
chore, landing before #315, with the #315, #330 and #331 plans written against Zustand stores.
The standing constraint holds: "do not over-engineer, its just front-end features without any
logic".

Zustand has been here before. ADR-002 (#44) chose it, #46 (`eaab4638`) migrated the auth store
to `create` + `devtools`, #42 (`da898d7f`) replaced that store with a reactive var while it
pulled Apollo off the paint path, and #279 (`8b159be2`) deleted the dependency. The paint-path
problem was Apollo, never Zustand, which is about 1 kB.

This chore swaps the primitive and nothing else. The auth and connectivity state keep their
fields, their initial values and their writers; only the container changes. The session rules
stay: the token lives in memory only, and the compile-guarded seed is still the only way a token
enters other than a login response.

## 2. Goals and non-goals

### Goals

1. Zustand `create` is the one primitive for client/UI and session state; the reactive var is
   gone from `src/`.
2. The auth and connectivity stores migrate with no visible behaviour change.
3. The gates allow Zustand, keep the `useSyncExternalStore` ban, and assert the new primitive.
4. ADR-023 and every contributor guide describe the same thing.

### Non-goals

- Middleware: no `persist` (the token is memory-only), no `devtools`, `immer`,
  `subscribeWithSelector` or `zustand/traditional`, and no `useShallow`.
- New stores for feature state; the feature bundles add their own fields to `AuthState`.
- Moving logic: `DeferredAuthActions` and `AuthStoreActions` keep their jobs (#331 moves
  sign-in). Their writes change from `AuthStateVar.set` to `setState`, nothing else.
- Server state: Apollo, the repositories and the cache rules are unchanged.
- ADR-002's text: it stays `Superseded`, as history.
- Any budget, threshold, glob or allowlist change.

## 3. Requirements

### FR-1 — The dependency

`zustand` `^5.0.15` (latest stable on 2026-10-08, `npm view zustand version`) joins
`dependencies` with a caret, like every other dependency except `react`/`react-dom`; `bun.lock`
resolves 5.0.15. It is MIT, has no runtime dependencies and needs `react >=18` (19.3.0 here).

### FR-2 — The auth store

`src/modules/user/features/auth/stores/use-auth-store.ts` exports
`useAuthStore = create<AuthState>()(…)` and the `CLEARED_AUTH_STATE` constant. The initial state
is `CLEARED_AUTH_STATE` with `token` from `preloadedAuthTokenSeed.read()`. `AuthState` stays a
named interface in `@auth/types/auth-store.ts`, beside `AuthStatePatch = Partial<AuthState>`,
which this chore adds if #332 has not. The store holds state only, no functions.

### FR-3 — Reads through selectors

`useAuthToken` becomes `useAuthStore((s) => authStoreSelectors.token(s))` and `useAuthState`
becomes `useAuthStore()`. Their call sites do not change. `useConnectivity` becomes
`useConnectivityStore((s) => s.online)`.

### FR-4 — Writes through `setState`

- `DeferredAuthActions` (`@auth/stores/index.ts`) writes `useAuthStore.setState(patch)`. Logout
  and reset write `CLEARED_AUTH_STATE`; `resetRegistration` and `clearLoginError` become inline
  patches.
- `AuthStoreActions` gets the store as `AuthStoreActionsDeps.authState`, typed
  `StoreApi<AuthState>`, and calls `setState`. It never value-imports the store (#130).

### FR-5 — DI registration

`AUTH_TOKENS.AuthStore` replaces `AUTH_TOKENS.AuthStateVar`. `UserModuleRegistrar` registers
`useAuthStore` by value under it, typed `StoreApi<AuthState>`, so DI-constructed classes, such
as the `SessionLinkFactory` of #330, use `getState()` and `setState()`.

### FR-6 — The connectivity store

`src/lib/connectivity/use-connectivity-store.ts` exports
`useConnectivityStore = create<ConnectivityState>()(() => ({ online: true }))`.
`BrowserConnectivityAdapter` takes `StoreApi<ConnectivityState>` and writes
`setState({ online })`; `src/index.tsx` passes the store; the `UIForm` story writes through
`setState`.

### FR-7 — Retired code

`src/lib/state/` (`ReactiveVarFactory`, `ReactiveVarState`, `use-reactive-var.ts`, the
`ReactiveVar` types), `AuthStateVar` (`auth-var.ts`) and `ConnectivityStateVar` are deleted, with
their tests and the `auth-var.ts` entry in `config/di-collaborator-policy.js`.

### FR-8 — The seed

`preloaded-auth-token.ts` is not edited. The store calls `read()` once, at creation. The
CLAUDE.md seed-gate invariants hold: the guard and both reads stay in that one method, and no
other `src/` file names the window key or the token variable.

### FR-9 — Test reset

`tests/utils/reset-client-stores.ts` restores both stores to their initial state
(`setState(getInitialState(), true)`). Every test that writes a store calls it in `beforeEach`;
`docs/state-architecture.md` documents it.

### FR-10 — Gates

- ESLint `clientStateSelectors`: the Zustand selector goes; the three `useSyncExternalStore`
  selectors stay, now with no exempt file, since only Zustand calls it internally.
- The `src/lib/state/use-reactive-var.ts` ESLint block, its `stateBridgeSite` probe and its
  must-pass exemption are deleted; the Zustand must-fail fixtures become one must-pass control.
- `tests/unit/config/eslint-policy.test.ts` pins the Zustand selector absent and the
  `useSyncExternalStore` selector present.
- `state-architecture-contract.test.ts` asserts Zustand is the primitive, imported only from
  the root specifier (no middleware), and that `src/lib/state` is gone.
- `config/class-naming-policy.js` drops `*Var` and `*State`, which no class uses afterwards.

### FR-11 — Decision and documentation

ADR-023 "Zustand for client state" supersedes ADR-008 and carries forward its server-state and
session-token rules. `docs/adr/README.md`, `docs/state-architecture.md`, `CLAUDE.md`,
`AGENTS.md`, `.github/copilot-instructions.md`, `.claude/skills/AI-AGENT-GUIDE.md` and
`.claude/react-sdlc.yml` (`framework.state: zustand`) follow.

## 4. Non-functional requirements

- **NFR-1 — No behaviour change.** Unit, integration, e2e, visual and a11y results are unchanged;
  no baseline moves.
- **NFR-2 — Paint path stays container-free.** The eager graph gains `zustand` and nothing else;
  no tsyringe, Apollo or zod reaches it.
- **NFR-3 — Budget measured.** The eager entrypoint raw and gzip sizes are recorded before and
  after; a breach is fixed at the source, never by raising a budget.
- **NFR-4 — Gates green, no suppression.** Mutation (`break` 100), coverage 100, the console
  gate, metrics and jscpd pass with no disable comment, cast, threshold or allowlist change.
- **NFR-5 — Session contract.** The token is memory-only; no `zustand/*` subpath import exists
  in `src/`.

## 5. Dependencies and order

- **Landing order:** chore #332 and this chore, in either order, then #315 → #330 → #331.
- **Rebase rule:** whichever chore lands second rebases. Deleting the `use-reactive-var.ts`
  ESLint block also deletes #332's TB-1 spread in it, its `stateBridgeSite` probe fixtures and
  its policy-pin row. If #332 lands first, `AuthStatePatch` already exists and its
  `AuthStateVar.set(patch: AuthStatePatch)` fix disappears with the file.
- #315 neither reads nor writes `useAuthStore`; #330 and #331 extend `AuthState` only.

## 6. Open questions

- **Q1 — Issue number.** Resolved: #334.
- **Q2 — ADR-023 status.** Default `Approved`, because the user decided and ADR-008 can only
  be superseded by an approved record; #332's ADR-022 lands `Proposed`.
- **Q3 — Wrapper hooks.** Default: keep `useAuthToken` and `useAuthState` as one-line selector
  hooks (least churn) instead of inlining `useAuthStore(…)` at their four call sites.
