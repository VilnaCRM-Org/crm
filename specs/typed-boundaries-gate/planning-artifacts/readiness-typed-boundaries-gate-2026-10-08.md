---
status: complete
workflowType: implementation-readiness
project_name: crm
date: 2026-10-08
feature: typed-boundaries-gate
issue: 332
iteration: 1
author: 'implementation-readiness checker, autonomous run'
inputDocuments:
  - specs/typed-boundaries-gate/planning-artifacts/prd-typed-boundaries-gate-2026-10-08.md
  - specs/typed-boundaries-gate/planning-artifacts/architecture-typed-boundaries-gate-2026-10-08.md
  - specs/typed-boundaries-gate/planning-artifacts/epics-typed-boundaries-gate-2026-10-08.md
  - crm-worktrees/_planning-shared/miro-layer-contract.md (§4, §4.1)
  - crm-worktrees/_planning-shared/over-engineering-review-2026-10-08.md (Part 3 item 2)
  - eslint.config.mjs
  - config/class-naming-policy.js
  - config/docs-policy.json
  - bmalph dist/transition/story-parsing.js
---

# Implementation readiness: typed-boundaries gate (chore), iteration 1

**Checker:** BMad implementation-readiness, non-interactive. **Date:** 2026-10-08.

## Summary

The chore carries the TB-1 gate that #315 Epic 0 used to own (former Stories 0.3 to 0.6), trimmed
per the over-engineering review, Part 3 item 2:

- **Dropped:** `@typescript-eslint/explicit-module-boundary-types`, because
  `explicit-function-return-type` is already `error` on every TypeScript file
  (`eslint.config.mjs:697-781`); the `generated-contracts-below-data-provider` rule with its
  `exclude` → `doNotFollow` switch, because no existing gate needs it.
- **Merged:** the type-file and code-file burn-downs and `consistent-type-definitions` into one
  story, Story 1.2.
- **Kept:** the selector wiring in every `src` block (the hooks, locale-formatter and
  `use-reactive-var` blocks included), the must-fail fixtures, the scope assertion, the policy
  pin, `*Transformer` in and `Controller` out of the class-naming policy and the `CLAUDE.md`
  table, and the `CLAUDE.md` TB-1 section.
- **Not here:** the TB-2 naming check stays in #315 (Story 0.2), where `LoginUserDto` and
  `RegisterUserDto` are renamed; the check would fail on the old names in this chore.

## Checks

- **Parser** (`parseStoriesWithWarnings`): 1 epic, 2 stories, 26 criteria, `warnings: []`; every
  criterion is one line.
- **TB-1** is pasted verbatim in the PRD and the architecture: sha256 `eb676341…`, equal to the
  contract §4.
- **ADR drift:** Story 1.2 edits `src/config/env/`, `src/config/runtime/` and
  `src/routes/route-composer.tsx`, significant paths in `config/docs-policy.json`; ADR-022 lands
  in Story 1.1, before them.
- **Traceability:** FR-1 to FR-6 and NFR-1 to NFR-3 each map to a story (epics coverage map) and
  to an architecture section (§10).
- **Gates:** no threshold, glob or allowlist is relaxed; the chore only adds rules.
- **Format:** no prose line over 100 characters; `prettier --check` and `markdownlint`
  (`-p /dev/null`) exit 0; the Mermaid block renders with `@mermaid-js/mermaid-cli@11.4.2`.

## Risks

- **R1 — Burn-down size (Medium).** About 115 sites in about 60 files in one story, plus the sites
  the F8 positions and the three later blocks add. Mitigation: re-measure first, fix at the source,
  and keep the change type-only, so review reads it as mechanical.
- **R2 — Interface assignability (Low).** An interface is not assignable to an index-signature
  type where the alias was; the receiving type is named, never cast.
- **R3 — Syntactic limits (Low).** Primitive-alias elements, exception (i) and test builders stay
  review items (architecture §7).
- **R4 — Ordering (Low).** #315, #330 and #331 must not merge before this chore; each lists it as
  its prerequisite.

Result: 0 Critical, 0 High, 1 Medium, 3 Low.

Verdict: PASS
