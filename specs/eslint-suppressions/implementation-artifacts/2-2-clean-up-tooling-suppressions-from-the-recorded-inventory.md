# Story 2.2: Clean Up Tooling Suppressions From the Recorded Inventory

Status: done

## Story

As a contributor,
I want to remove safe ESLint suppressions from tooling files identified in the recorded
inventory,
so that repository automation improves without mixing tooling cleanup with source or test
changes.

## Acceptance Criteria

1. Given Story 2.1 recorded the before-cleanup inventory in the baseline artifact, when the
   contributor starts tooling cleanup, then only suppression entries under `scripts` or the
   ESLint config file are in scope for this story, and suppressions under `src` and `tests`
   are deferred to their dedicated cleanup stories.
2. Given a tooling suppression from the recorded inventory is inspected, when the underlying
   lint issue can be fixed safely with code, test, or lint-configuration, then the suppression
   is removed and the related behaviour remains equivalent.
3. Given a tooling suppression from the recorded inventory is inspected, when removing it would
   require unrelated redesign or risky behavioural changes, then the suppression is left in
   place for the MVP baseline and the rationale is recorded in the baseline artifact.
4. Given cleanup changes are made in tooling files, when relevant existing lint checks are run,
   then those lint checks remain usable and do not introduce unrelated lint regressions.
5. Given the recorded before-cleanup inventory contains no tooling suppressions, when this
   story is executed, then the baseline artifact records zero tooling suppressions in scope and
   no tooling cleanup code changes are required.

## Tasks / Subtasks

- [x] Task 1: Identify the in-scope tooling inventory (AC: 1, 5)
  - [x] 1.1 Confirm `scripts` has zero suppressions
  - [x] 1.2 Confirm the only tooling entry is `eslint.config.mjs:173`
- [x] Task 2: Decide and record the tooling cleanup outcome (AC: 2, 3, 4)
  - [x] 2.1 Determine that dropping the `eslint-comments/no-use` `allow` list now is unsafe
  - [x] 2.2 Leave it in place for the MVP baseline and record the rationale in
        `eslint-suppressions-baseline.md`
  - [x] 2.3 Confirm no lint regression (no tooling code change made)

## Dev Notes

- The only tooling inventory entry is the `eslint-comments/no-use` `allow` list at
  `eslint.config.mjs:173`. `scripts` contains no suppressions.
- The `allow` list permits the two real `eslint-disable` directives still present in `src`
  (`http-error-response-parser.ts:49`) and `tests` (`form-section.test.tsx:2`). The rule is set
  to `error`, so removing the list now would flag those directives and break `make lint-eslint`
  (AC 4 forbids unrelated lint regressions). The PRD's lint-configuration fix (dropping the
  `allow` list) is therefore deferred until the source (Story 2.3) and test (Story 2.4)
  suppressions are removed; it lands in or after Story 2.4 and is re-inventoried in Story 2.5.
- This story makes no code change. Per AC 3, the tooling suppression is left in place with the
  deferral rationale recorded in the baseline artifact. `src` and `tests` remain out of scope.
- Superseded by Story 2.5: the deferral above is the historical interim decision for this
  story. Once the source (Story 2.3) and test (Story 2.4) suppressions were removed, the
  `eslint-comments/no-use` allow-list was dropped from `eslint.config.mjs`; the final repository
  state has no allow-list.

## Dev Agent Record

### Agent Model Used

claude-opus-4-8

### Completion Notes List

- Verified in-scope tooling inventory: `scripts` = 0; `eslint.config.mjs:173` = the
  `eslint-comments/no-use` allow-list (1).
- No tooling code change. Full Bats suite 24/24 pass; `make lint-eslint-suppressions` still
  reports the unchanged before-cleanup inventory (3) and exits non-zero.

### File List

- `specs/eslint-suppressions/implementation-artifacts/eslint-suppressions-baseline.md`
- `specs/eslint-suppressions/implementation-artifacts/2-2-clean-up-tooling-suppressions-from-the-recorded-inventory.md`

### Change Log

- 2026-06-10: Story 2.2 — recorded the tooling cleanup decision: the `eslint.config.mjs`
  `eslint-comments/no-use` allow-list is left in place for the MVP baseline (deferred to after
  Stories 2.3/2.4) with rationale; no tooling code change.
- 2026-06-10: superseded by Story 2.5 — the allow-list was later removed from
  `eslint.config.mjs` after Stories 2.3/2.4; the deferral above is the historical interim state.
