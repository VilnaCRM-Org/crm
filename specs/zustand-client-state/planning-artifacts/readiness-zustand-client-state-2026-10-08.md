---
status: complete
workflowType: implementation-readiness
project_name: crm
date: 2026-10-08
feature: zustand-client-state
issue: 334
iteration: 1
author: 'implementation-readiness checker, autonomous run'
inputDocuments:
  - specs/zustand-client-state/planning-artifacts/prd-zustand-client-state-2026-10-08.md
  - specs/zustand-client-state/planning-artifacts/architecture-zustand-client-state-2026-10-08.md
  - specs/zustand-client-state/planning-artifacts/epics-zustand-client-state-2026-10-08.md
  - crm-worktrees/_planning-shared/miro-layer-contract.md (§2.3, §3.4, §5)
  - config/docs-policy.json
  - config/performance-budget.json
  - bmalph dist/transition/story-parsing.js
---

# Implementation readiness: Zustand for client state (chore), iteration 1

**Checker:** BMad implementation-readiness, non-interactive. **Date:** 2026-10-08.

## Summary

The chore delivers exactly the shape of the shared contract §2.3: `zustand` added, `useAuthStore`
and `useConnectivityStore` created with `create` and no middleware, `AUTH_TOKENS.AuthStore`
registered by value as `StoreApi<AuthState>`, `src/lib/state`, `AuthStateVar` and
`ConnectivityStateVar` deleted, ADR-023 superseding ADR-008. It is kept lean:

- **No new logic.** Writers keep their jobs; only `set` becomes `setState`.
- **No middleware.** No `persist` (memory-only token), no `devtools`, no `useShallow`.
- **Wrappers kept.** `useAuthToken` and `useAuthState` become one-line selector hooks, so their
  four call sites and their mocks do not move (PRD Q3).
- **Gates trimmed, not added.** The Zustand ban, the bridge block and its probe go; the
  `useSyncExternalStore` ban stays; the contract test is rewritten, not extended with a new tool.

## Checks

- **Parser** (`parseStoriesWithWarnings`): 1 epic, 3 stories (13, 26 and 12 criteria),
  `warnings: []`; every criterion is one line.
- **Contract §2.3 shape:** store files, export names, token, `StoreApi<AuthState>` typing,
  `AuthStatePatch`, adapter write and retired names all match, line by line.
- **Seed invariants:** `preloaded-auth-token.ts` is not edited and the store names neither
  identifier (architecture §4).
- **ADR drift:** the `package.json` dependency change is significant; ADR-023 lands in Story 1.1
  of the same pull request. Number 023 follows 018 to 022, claimed by #311, #315, #331, #330 and
  #332.
- **Ordering inside the PR:** docs come last, because the contract test pins the guides to the
  code (epics overview).
- **Budget:** about +1 kB raw and +0.5 kB gzip at most on the eager entrypoint, against about
  40 kB raw headroom (architecture §7); no budget edit.
- **Traceability:** FR-1 to FR-11 and NFR-1 to NFR-5 each map to a story (epics coverage map)
  and to an architecture section (§12).
- **Format:** no prose line over 100 characters; `prettier --check` and `markdownlint`
  (`-p /dev/null`) exit 0; the four Mermaid blocks render with `@mermaid-js/mermaid-cli@11.4.2`.

## Risks

- **R1 — Test churn (Medium).** About 25 tests change, most from `authStateVar.reset()` to
  `resetClientStores()`, and eight are replaced by three. Mitigation: the helper is one call per
  `beforeEach`; the integration suite gets its own store test to keep its 100 % `src` coverage.
- **R2 — Static initializer mutants (Low).** The store initializers run at import. Mitigation:
  their tests load the module with `tests/unit/utils/isolated-module.ts` (architecture §6).
- **R3 — Rebase with #332 (Low).** Both chores edit `eslint.config.mjs`, the fixtures and the
  policy pin. Mitigation: the rule in PRD §5; the second to land deletes or drops the bridge
  block's TB-1 wiring.
- **R4 — Mobile Lighthouse (Low).** The mobile floor has no headroom, and zustand reaches the
  paint path. Mitigation: the net delta is under 1 kB raw; CI Lighthouse is the authority; a
  regression is fixed at the source.
- **R5 — Selector identity (Low).** Zustand v5 loops on a selector that returns a fresh object.
  Mitigation: every selector returns a field or the stable state object (architecture §3.1).

Result: 0 Critical, 0 High, 1 Medium, 4 Low.

Verdict: PASS

## Open questions

- **Q1:** resolved, the chore issue is #334.
- **Q2:** ADR-023 lands `Approved` (default) or `Proposed` like #332's ADR-022.
- **Q3:** keep the two wrapper hooks (default) or inline `useAuthStore(…)` at four call sites.
