---
status: complete
workflowType: implementation-readiness
project_name: crm
date: 2026-10-05
revised: 2026-10-08
feature: create-new-password
issue: https://github.com/VilnaCRM-Org/crm/issues/315
iteration: 8
author: 'implementation-readiness checker, autonomous run'
inputDocuments:
  - specs/create-new-password/planning-artifacts/run-summary-create-new-password-2026-10-05.md
  - specs/create-new-password/planning-artifacts/brief-create-new-password-2026-10-05.md
  - specs/create-new-password/planning-artifacts/prd-create-new-password-2026-10-05.md
  - specs/create-new-password/planning-artifacts/architecture-create-new-password-2026-10-05.md
  - specs/create-new-password/planning-artifacts/epics-create-new-password-2026-10-05.md
  - codegen.ts
  - docker/apollo-server/lib/server.ts
  - docker/apollo-server/lib/resolvers.ts
  - docker/apollo-server/lib/format-error.ts
  - Apollo.Dockerfile
  - docker-compose.test.yml
  - src/modules/user/config/di.ts
  - src/modules/user/features/auth/stores/index.ts
  - src/lib/reliability/chunk-retry-loader.ts
  - config/metrics-policy.json
  - config/docs-policy.json
  - eslint.config.mjs
  - bmalph dist/transition/story-parsing.js and story-id.js
  - 'crm-worktrees/_planning-shared/miro-layer-contract.md (2026-10-08)'
  - 'crm-worktrees/_planning-shared/over-engineering-review-2026-10-08.md'
  - 'crm-worktrees/typed-boundaries-gate/specs/typed-boundaries-gate (prerequisite chore)'
---

# Implementation readiness: password recovery (create new password), iteration 8

**Checker:** BMad implementation-readiness, adversarial and non-interactive. **Date:**
2026-10-08. **Feature:** `create-new-password`. **Iteration:** 8.

## Summary

This check re-reads the bundle after the simplification of 2026-10-08
(`crm-worktrees/_planning-shared/over-engineering-review-2026-10-08.md`; the user: "apply all 10",
"do not over-engineer, its just front-end features without any logic"). Every #315 item of the
review is applied; one optional item is not (below).

| Measure                 | Before (iteration 7) | After (iteration 8)    |
| ----------------------- | -------------------- | ---------------------- |
| New classes (+ changed) | 7 (+3)               | 5 (+2)                 |
| New hooks (+ changed)   | 7 (+1)               | 7 (+1)                 |
| Named types             | 68                   | 46                     |
| New components          | 15                   | 13                     |
| Stories                 | 35                   | 23 (+2 in the chore)   |
| Acceptance criteria     | 351                  | 277 (+26 in the chore) |
| DI tokens / closures    | 5 / 1                | 4 / 0                  |
| GoF patterns            | Proxy, Factory       | none                   |

What changed:

- **Gate split (review item 2).** The TB-1 gate, its burn-down, `consistent-type-definitions`, the
  suffix policy and the CLAUDE.md section moved to the prerequisite chore `typed-boundaries-gate`
  (former Stories 0.3 to 0.6). `explicit-module-boundary-types` and the
  `generated-contracts-below-data-provider` rule were dropped. Epic 0 keeps ADR-019 with the two
  folders (Story 0.1) and the User domain with the TB-2 naming check (Story 0.2). Superseded
  2026-10-13: Story 0.1 adds no ADR (PRD NFR-16); see the ADR-drift check below.
- **Mock (item 3).** Story 1.1 keeps the extension, the codegen entry and a stateless happy path
  with one violation per mutation; the expiry checker, its fixtures, `pending-schema.ts`, the
  magic-input table and the dev-server flag transform are gone.
- **Security signal (item 4).** FR-25 is withdrawn, with `AuthSecuritySignals.recoverySettled`,
  the `password_reset` category and the provider's deps bag, token and closure.
- **Stories (item 5).** 1.7 + 1.8 → 1.5; 2.1 + 2.2 + 2.3 → 2.1; 2.5 + 2.6 → 2.3; 3.2 + 3.3 → 3.2;
  1.5 → 3.1; ids renumbered from 0.1, 1.1, 2.1, 3.1 and 4.1.
- **Types (item 6).** The aborted and interrupted outcomes, `RecoveryOutcome`, the five
  rule-table types, `RecoveryRetry`, `FormErrorActionHandler`, the provider interface, the two
  deps types and `LoadFailureReporter` are gone; `*Handlers` became `*Callbacks`.
- **Loader (item 8).** One container-free `AuthProviderLoader` in `@auth/stores/index.ts`
  (`resolve<T>(token)` over `ChunkRetryLoader`) replaces the proxy, its factory and the provider
  interface; the Data provider is the plain `PasswordRecoveryProvider`.
- **Transformers (item 9).** One feature Transformer plus the shared
  `UserServiceErrorTransformer`, whose classification is now an ordered step list with a status
  table that later bundles append to; the 3a/7a slot ceremony is gone.
- **Token (item 10).** `ResetTokenSource` became `useResetToken(): string | null`.
- **Shared pieces (item 1).** #315 owns them, and the landing order #315 → #330 → #331 is
  recorded in the planning contract §3.4.
- **Smaller items (item 12).** `SentView` and `InvalidLinkView` became plain uses of
  `RecoveryResultView`; the zod result schemas of two `void` mutations are gone.

**Not applied.** The review's optional move of `UserEntity` to #330: Story 0.2 keeps it, because
the module barrel exports it in place of `SafeUserInfo` and #330 and #331 already import it.

## Checks

- **Parser** (`parseStoriesWithWarnings`, `compareStoryIds`): 5 epics, 23 stories (0.1, 0.2, 1.1
  to 1.5, 2.1 to 2.5, 3.1 to 3.6, 4.1 to 4.5) and 277 criteria, `warnings: []`. File order equals
  bmalph's id sort; no follow-up is parsed.
- **Dependencies.** The Mermaid solid edges equal the `Depends on` lines, every edge points
  backward in file order, and the recomputed waves equal the 12 listed.
- **Traceability.** Every FR row of the coverage map equals the union of the Requirements lines;
  FR-25 is withdrawn in the PRD, the epics and architecture §16; every other FR and every NFR has
  a story and an architecture mechanism.
- **Metrics claims.** `stores/index.ts` holds eight functions and three closures today; the
  loader adds one method and one closure (9 / 4 / 13). `UserModuleRegistrar` keeps nine functions
  and three closures, because no `useFactory` is added. The provider takes three injected
  collaborators, the argument cap.
- **ADR drift.** The only significant path is `.dependency-cruiser.js` (Story 0.1), which lands
  with ADR-019; `rsbuild.config.ts` and `src/config/**` are no longer touched. Superseded
  2026-10-13: no ADR-019 is written. Every ADR from 003 up was deleted on PR #333, the decisions
  live in the `## Password recovery decisions` section of `src/modules/user/README.md`, and the
  gate passes through a `[no-adr]` line in the pull-request body (PRD NFR-16).
- **Mock.** The violations throw with `extensions.code` `BAD_USER_INPUT` so the real
  `formatError` keeps their message (the iteration-6 finding M8 still holds); no test imports
  `server.ts`.
- **TB-1 and TB-2** are byte-identical in the PRD, the architecture and the contract (sha256
  `eb676341…` and `b760fede…`). TB-2's frozen text names the naming check's story by its former
  id, 0.7; the PRD, the architecture and the contract note that it is now Story 0.2.
- **Format.** No prose line over 100 characters; `prettier --check` and `markdownlint`
  (`-p /dev/null`) exit 0 on all seven artifacts; every Mermaid block renders with
  `@mermaid-js/mermaid-cli@11.4.2`.

## Risks

- **R1 — Cross-bundle alignment (Medium).** #330 and #331 must adopt the loader, the step-list
  classification, the owner map and the landing order; their bundles are revised separately.
- **R2 — Manual extension deletion (Low).** No checker forces Follow-up 5.3 to delete the pending
  extension; graphql-codegen and Apollo Server merge an identical duplicate silently, so the
  follow-up lists every file to delete.
- **R3 — Thin mock (Low).** The local mock answers the happy path and one violation per mutation;
  every other shape is exercised by the route mocks and msw, which CI runs.
- **R4 — Board gaps (Low, not blocking).** The entry-link edge and the code-level
  `ResetPassword` / `CreateNewPassword` cards are proposed to the board owner.
- **R5 — Prerequisite order (Low).** Epic 0 must not merge before chore #332 or the chore
  `zustand-client-state` (#334); this bundle says so, and #332's bundle does for its chore.
  The Zustand chore has no bundle yet; it is filed after this pass.

Result: 0 Critical, 0 High, 1 Medium, 4 Low.

Verdict: PASS

## History

- Iterations 1 to 6 (2026-10-05): FAIL (2 High), FAIL (1 High), PASS, the GraphQL revision, PASS
  and the mocked-GraphQL revision, PASS. Their findings were applied; L22, L24 and L25 (the
  `pending-schema.ts` coverage trap, the dev transform and the expiry test) are moot since
  iteration 8 removed those pieces.
- Iteration 7 (2026-10-08): typed boundaries and the Miro layers, the independent verification
  (F1 to F21, D1 to D10) and the shared User domain; PASS.
- Iteration 8 (2026-10-08): the simplification above; PASS.
- Final check (2026-10-08): architecture §5.5 names #330 as the bundle that adds the
  exact-message step (m2); 23 stories, 277 criteria unchanged; PASS.
- Zustand revision (2026-10-08; the user: "change the react state var to zustand", "1, but
  firstly update the diagrams"): the board's `State [Redux]` is drawn `State [Zustand]` with
  `useAuthStore` (architecture §3.2), the epics dependency graph draws both prerequisite chores,
  and every reactive-var reference now names `useAuthStore`. The migration belongs to the new
  prerequisite chore `zustand-client-state`; no story was added, 23 stories and 277 criteria
  unchanged; TB-1 and TB-2 still byte-identical; PASS.
