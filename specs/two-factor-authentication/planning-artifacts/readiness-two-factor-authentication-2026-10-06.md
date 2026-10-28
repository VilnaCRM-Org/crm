---
status: complete
workflowType: implementation-readiness
project_name: crm
date: 2026-10-06
revised: 2026-10-08
feature: two-factor-authentication
issue: https://github.com/VilnaCRM-Org/crm/issues/331
iteration: 4
author: 'implementation-readiness checker, autonomous run'
inputDocuments:
  - ./research-two-factor-authentication-2026-10-06.md
  - ./brief-two-factor-authentication-2026-10-06.md
  - ./prd-two-factor-authentication-2026-10-06.md
  - ./architecture-two-factor-authentication-2026-10-06.md
  - ./epics-two-factor-authentication-2026-10-06.md
  - ./run-summary-two-factor-authentication-2026-10-06.md
  - 'src/modules/user/features/auth/{repositories,stores,types}/*'
  - 'src/modules/user/config/{di,tokens}.ts, src/config/api-config.ts'
  - 'config/{di-collaborator-policy,class-naming-policy}.js, config/metrics-policy.json'
  - 'tests/e2e (the specs that stub **/api/users), tests/integration/mocks/server.ts'
  - 'bmalph dist/transition/story-parsing.js'
  - 'crm-worktrees/_planning-shared/miro-layer-contract.md (2026-10-08)'
  - 'crm-worktrees/_planning-shared/over-engineering-review-2026-10-08.md'
  - 'crm-worktrees/typed-boundaries-gate (chore #332, draft PR #333)'
  - 'chore zustand-client-state (#334; Zustand stores, supersedes ADR-008)'
  - 'crm-worktrees/password-recovery-planning (#315, simplified 2026-10-08)'
---

# Implementation readiness: two-factor authentication, iteration 4

**Checker:** BMad implementation-readiness, adversarial and non-interactive. **Date:**
2026-10-08. **Feature:** `two-factor-authentication`. **Iteration:** 4.

## Summary

This check re-reads the bundle after the simplification of 2026-10-08
(`crm-worktrees/_planning-shared/over-engineering-review-2026-10-08.md`; the user: "apply all
10", "do not over-engineer, its just front-end features without any logic, its all in the
back-end side", and "we should use only repositories to access data but with graphql, not the
REST, we use only graphql").

| Measure                 | Before (iteration 3) | After (iteration 4)          |
| ----------------------- | -------------------- | ---------------------------- |
| New classes (+ changed) | 9 (+9)               | 7 (+8), 2 deleted            |
| New hooks               | 8                    | 8                            |
| New named types (§7.3)  | 57                   | 40                           |
| Stories                 | 32                   | 23                           |
| Acceptance criteria     | 444                  | 243                          |
| Follow-ups              | 9                    | 8                            |
| DI tokens / closures    | 7–8 / 1              | 6 new, 2 removed / 0         |
| GoF patterns            | Strategy, Proxy      | none                         |
| Requirements            | 67                   | 67 (FR-2 withdrawn, 66 live) |

What changed:

- **Sign-in is GraphQL only (user decision).** `GraphQLSignInProvider` is the one sign-in Data
  provider; `useSignInSubmit` resolves it through #315's loader and writes the `AuthStatePatch`
  (a challenge writes `pendingSessionId`, never the token); only the sign-in path leaves
  `AuthStoreActions` (final check, 2026-10-08). The `SignInProvider` Strategy, its legacy REST
  implementation and the flag read in the DI factory are gone. Story 2.3 removes the REST login:
  `src/config/api-config.ts`, `LoginAPI`, `AuthRepositoryImpl.login`, `LoginResponseMapper`,
  `LoginResponseSchema`, `LoginResponse`, two tokens, their registrations, the `api-config`
  policy carve-out, their tests, the msw REST handler, and the REST stubs of five e2e specs. Its
  criteria require that a repository search finds no REST login and that registration is
  unchanged. Registration was checked in the code: `RegistrationAPI` already sends the GraphQL
  `createUser` mutation (`registration-api.ts:48-56`), and nothing else imports `api-config.ts`.
- **The `twoFactorAuth` flag gates only the 2FA section** on #330's page. It no longer selects a
  transport and no longer gates a route: a sign-in that returns a challenge must always reach
  `/sign-in/two-factor`. The route `flags` cases, the forced-off REST specs, the dev-server
  transform and the dev-stack enablement are gone; the test stack enables it in Story 4.1.
- **One owner per shared piece (item 1).** #331 imports from #315 (loader, `useAbortableSubmit`,
  error Transformer, card pieces, `UIForm` `errorAction`/`titleRef`, arrival notices, pending
  directory) and from #330 (settings page and slot, `SessionLinkFactory` with its anonymous set,
  `RouteFlagGate`, `UIForm` `footer`, error-red token, `session_ended` notice,
  `settings/utils/response-schemas.ts`, the 401 and message-step rows). The mock reads no token,
  as #330's does; every 401/403 branch comes from msw and `page.route`. Former Stories 1.7, 1.8,
  2.1 (token half), 2.2 (three props), 2.3, 2.9 (generic half) and 3.1 are deleted; no "if
  absent" branch remains.
- **Mock (item 3).** One pending file, the `Iterable` mapping and stateless resolvers: the happy
  path, the `2fa` local part for the challenge, and one `422` per mutation that takes input. The
  expiry checker (FR-2, withdrawn), the stateful per-e-mail mock, `mock-session`,
  `mock-expired-token` and their tests are gone.
- **Security signal (item 4).** The settings-side `two_factor` signal, its deps bag, token and
  closure are dropped; `TwoFactorSettingsProvider` takes three `@inject` collaborators.
- **Stories (item 5).** 1.1 + 1.3 → 1.1; 2.5 + 2.6 → 2.2; 2.9 → 2.7; 3.5 + 3.6 → 3.4; Story 4.5
  trimmed to 10 criteria; one new story, 2.3.
- **Types (item 6).** `PendingChallenge` → scalar `pendingSessionId`; the aborted outcome
  variants, `ChallengeOutcome`, `ChallengePhase`, the twin banner and field-error types,
  `SignInTwoFactorStatus`, `TwoFactorChallengeModel` and its props type are collapsed;
  `*Handlers` became `*Callbacks`.
- **Service-role class (item 7).** `TwoFactorChallengeActions` and `AuthStateActions` are gone;
  `DeferredAuthActions` loses only `loginUser` (final check, 2026-10-08).
- **Loader (item 8).** The sign-in and challenge hooks resolve `GraphQLSignInProvider` through
  #315's `AuthProviderLoader` (`useAuthProviderLoader`) inside their `useAbortableSubmit` runs.
- **Transformers (item 9).** One feature Transformer per feature beside #315's shared one; this
  feature appends rows to #315's step list after #330's (input properties, `423 → locked`, six
  exact-message rows) and no 3a/7a slot.
- **Glue (item 10).** The `busy` view flag is gone (`isSubmitting` covers it); the disable and
  regenerate confirmations share one view.

## Checks

- **Parser** (`parseStoriesWithWarnings`): 4 epics, 23 stories (1.1 to 1.5, 2.1 to 2.8, 3.1 to
  3.5, 4.1 to 4.5) and 243 criteria, `warnings: []`; no follow-up is parsed.
- **Dependencies.** The 44 solid edges of the epics graph equal the `Depends on` lines, every
  edge points backward in file order, and the 11 waves recompute from them; architecture §16
  lists the same dependencies.
- **Traceability.** The coverage map equals the union of the 23 `**Requirements:**` lines; every
  live FR and every NFR has a story; FR-2 is withdrawn in the PRD, the epics and architecture
  §17.
- **Metrics claims.** `GraphQLSignInProvider` and `TwoFactorSettingsProvider` take three injected
  collaborators each, the argument cap; `AuthStoreActions` drops to seven functions and
  `DeferredAuthActions` loses `loginUser`; `UserModuleRegistrar` keeps nine functions and gains no
  closure; `use-sign-in-submit.ts` and `use-login-submitter.ts` stay within ten functions.
- **Board conformance.** No class is a Controller, Service or Handler; no diagram carries a REST
  node, a Strategy or a State-actions class. Sign-in and the challenge both go page → React hook →
  Data provider through the loader, and the hook writes State (architecture §3.3, §19.2).
- **TB-1 and TB-2** are byte-identical in the PRD, the architecture and the contract (sha256
  `eb676341…` and `b760fede…`); TB-2's frozen text names #315 Story 0.7, which the bundle notes
  is now Story 0.2.
- **Format.** No line over 100 characters; `prettier --check` and `markdownlint` (`-p /dev/null`)
  exit 0 on all seven artifacts; the 14 Mermaid blocks of the architecture and the epics render
  with `@mermaid-js/mermaid-cli@11.4.2`.

## Risks

- **R1 — Prerequisite order (Medium).** Wave 1 waits for chore #332, chore
  `zustand-client-state` (#334, lands before #315), #315 Epic 0 (Stories 0.1–0.2) and every
  #315 and #330 piece the bundle imports; a slip there delays this bundle.
- **R2 — Production sign-in has no backend until #513 (Low).** Sign-in now calls `signInUser` in
  every environment; user-service v2.8.0 does not serve it. Today's REST placeholder posts
  credentials to the create-user endpoint, so production has no working sign-in either way;
  Follow-up 5.1 moves the pins once the release ships.
- **R3 — Settings 401 reading (Low).** #330's status row maps every `401` to `unauthenticated`,
  and this feature maps `unauthenticated` to the silent `session_ended`; a GraphQL `401` with an
  unknown message on a settings call would leave the section silent while the token stays.
  Upstream sends only the firewall's transport `401` for that text; Follow-up 5.1 re-checks it.
- **R4 — Challenge signal placement (Low).** Review item 7 put `challengeSettled` in the Data
  provider; that needs a fourth constructor argument (cap 3) or a deps bag, so the challenge hook
  records it through the same loader, skipping an aborted run (architecture §6.3).
- **R5 — Thin mock (Low).** The local mock answers the happy path and one violation per
  mutation; every other branch is exercised by msw and the Playwright stubs, which CI runs.
- **R6 — Deferred auth/DI chunk (Low).** The 317 727 B baseline is from 2026-07-20; Stories 2.2,
  2.5 and 3.2 measure the growth, and Story 2.3 shrinks it by the removed REST classes.

Result: 0 Critical, 0 High, 1 Medium, 5 Low.

Verdict: PASS

## History

- Iterations 1 to 3 (2026-10-06): FAIL (1 High), PASS, PASS. Their findings P1 to P9 were applied;
  the jscpd risk of the two controllers and the "first lander" coordination risks are moot.
- 2026-10-08 revisions (typed boundaries and the Miro layers, the independent verification F1 to
  F21 with D1 to D10, the shared User domain): PASS, 32 stories and 444 criteria.
- Iteration 4 (2026-10-08): the simplification above; PASS.
- Final check (2026-10-08): sign-in moved to `useSignInSubmit` over the loader, only the sign-in
  path leaves `AuthStoreActions` (Follow-up 5.9 for the rest), #330 owns the anonymous set and
  `settings/utils/response-schemas.ts`, m1–m5 applied; 23 stories, 243 criteria; PASS.
- Zustand revision (2026-10-08; the user: "change the react state var to zustand"): client state
  is the Zustand store `useAuthStore` built by the new prerequisite chore `zustand-client-state`
  (#334, lands before #315, beside chore #332). The diagrams were redrawn first (L2, both L3
  stacks, sequences 4.1 to 4.3, the challenge state machine, the epics dependency graph), then
  the text. This feature only adds `AuthState` fields, reads them with selectors and writes them
  from hooks with `useAuthStore.setState(AuthStatePatch)`; settings still reaches the store only
  through the outlet context (sibling-feature ban). No story added; PASS unchanged.

## Reconciliation 2026-10-27

Not a readiness run: the checks above were not re-executed. The bundle was reconciled to branch
`feat/331-two-factor-authentication` at `77f59152` (#315, #330 and #362 stacked on `main` with
`#311` and `#333`); the architecture's "Reconciliation 2026-10-27" list holds every correction with
the file it was verified against.

| Measure    | Before (iteration 4) | After reconciliation                    |
| ---------- | -------------------- | --------------------------------------- |
| Stories    | 23                   | 25 (Epic 1: 5, Epic 2: 9, 3: 6, 4: 5)   |
| Deleted    | —                    | none (#330 and #362 built no 2FA piece) |
| Split      | —                    | 2.3 → 2.3 + 2.9; 3.4 → 3.1 (new) + 3.4  |
| Renumbered | —                    | former 3.1 (low-codes notice) → 3.6     |
| Rewritten  | —                    | 1.2, 1.5, 2.4; criteria moved 2.7 → 2.6 |
| Follow-ups | 9                    | 9                                       |

- **Why the splits use whole numbers.** bmalph's header pattern accepts digits and dots only
  (`N.Ma` is dropped) and it sorts stories by number before writing the plan, so a split part
  that others depend on must take a lower free number: the low-codes notice moved to 3.6 to free
  3.1. Every `Depends on` still names a lower number; the epics' graph and waves were updated.
- **Corrections that change implementation:** no ADR files from 003 up (decisions go to
  `src/modules/user/README.md` with `[no-adr]`); the error transformer is
  `src/modules/user/transformers/user-service-error-transformer.ts`, `@injectable()`; `UIForm`
  has no `errorAction` (now Story 2.1's); sign-in shows #315's result card and
  `usePostLoginRedirect` only exposes `proceed()`; the registrar is at ten functions and four
  closures; the shell slot props extend the outlet context; the toolkit pin is v0.8.0;
  `UILinkButton` and `UICheckbox` are reused.
- **New risk R7 — stale fix plan (High until handled).** `.ralph/@fix_plan.md` holds #362's plan
  with ten completed `Story N.M` lines, and bmalph's `syncFixPlan` copies completed ids into a new
  plan; it must be moved aside before `bmalph implement`, or Stories 1.1, 2.1 to 2.5 and 3.1 to
  3.4 start checked and are skipped.
- **New risk R8 — dependency install in a worktree (Medium, owner question).** Story 3.1 adds
  `qrcode-generator` and a decoder, which changes `package.json` and `bun.lock`. This worktree's
  `node_modules` is a symlink to the main checkout's, so a host `bun add` here would install into
  the other checkout; the owner decides how the loop installs (a dev container bound to this
  worktree, or the lockfile edited and installed by CI).
- **R1 is now Low:** the prerequisites are ancestors of `77f59152`, though #315, #330 and #362
  are not merged yet.
