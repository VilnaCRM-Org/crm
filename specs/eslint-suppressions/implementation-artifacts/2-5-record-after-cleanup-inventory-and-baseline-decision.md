# Story 2.5: Record After-Cleanup Inventory and Baseline Decision

Status: done

## Story

As a maintainer,
I want the post-cleanup suppression state recorded clearly,
so that accepted baseline suppressions are distinguishable from future suppression debt.

## Acceptance Criteria

1. Given cleanup work is complete, when a contributor reruns
   `make lint-eslint-suppressions` against the default scan scope, then the after-cleanup
   suppression inventory is captured, and the after-cleanup count is recorded in
   `eslint-suppressions-baseline.md`.
2. Given no suppressions remain after cleanup, when the contributor records the result, then
   `eslint-suppressions-baseline.md` states that the repository contains no suppressions.
3. Given suppressions remain after cleanup, when the contributor records the result, then
   `eslint-suppressions-baseline.md` lists or summarizes them, and it includes rationale for
   why they are accepted or deferred.
4. Given future contributors review the baseline record, when a new suppression appears
   later, then they can distinguish it from the accepted remaining baseline.

## Tasks / Subtasks

- [x] Task 1: Resolve the final after-cleanup state of the deferred tooling allow-list
      (AC: 1, 2)
  - [x] 1.1 Confirm Stories 2.3 and 2.4 removed every real `src`/`tests` `eslint-disable`
        directive, so the `eslint-comments/no-use` allow-list no longer permits anything real
  - [x] 1.2 Drop the `allow` option at `eslint.config.mjs:171-174`, tightening the rule to
        a bare `'eslint-comments/no-use': 'error'`
  - [x] 1.3 Verify `make lint-eslint` still passes (no new errors introduced)
- [x] Task 2: Capture the after-cleanup inventory against the default scan scope (AC: 1)
  - [x] 2.1 Rerun `make lint-eslint-suppressions` and confirm it reports zero matches and
        exits zero
- [x] Task 3: Record the after-cleanup inventory and baseline decision (AC: 1, 2, 4)
  - [x] 3.1 Fill the "After-Cleanup Inventory" section of
        `eslint-suppressions-baseline.md` with the command output, count (0), and
        before/after table
  - [x] 3.2 Record the zero baseline and state that any future suppression is new debt
        (AC 2, 4); AC 3 is N/A because zero suppressions remain

## Dev Notes

- The only inventory entry left after Stories 2.3/2.4 was the deferred tooling allow-list at
  `eslint.config.mjs:173`. Story 2.2 deferred it because, while real `eslint-disable`
  directives still existed in `src` and `tests`, dropping the `allow` list would have made
  `eslint-comments/no-use` (set to `error`) flag those directives and break `make lint-eslint`.
- With 2.3 (source) and 2.4 (test) cleanups landed, that dependency is gone: dropping the
  `allow` list is now safe. Per the standing repository policy (never keep suppression
  directives; fix root causes) the strongest, policy-aligned outcome is to drop it so the
  after-cleanup inventory is **0**, rather than accept it as a remaining baseline.
- Dropping the `allow` list does double duty: it removes the only scan match (the string
  literals inside the option) **and** tightens the lint rule so ESLint itself blocks any
  future `eslint-disable*` comment as an error — a stronger guarantee than the standalone
  scan alone.
- The Bats suite (`tests/bats/eslint_suppressions.bats`) operates on sandbox fixtures, not
  the real `eslint.config.mjs`, so this config change does not affect it; the full suite
  stays green.
- No `src/` runtime code changed, so the rust-code-analysis and integration-coverage gates
  are unaffected. `eslint.config.mjs` lives at the repo root, outside the `src/` metrics
  scope.

## Dev Agent Record

### Agent Model Used

claude-opus-4-8

### Completion Notes List

- Dropped the `eslint-comments/no-use` `allow` list in `eslint.config.mjs`, tightening the
  rule to `'eslint-comments/no-use': 'error'`.
- After-cleanup `make lint-eslint-suppressions` reports
  "No ESLint suppression directives found in: src tests scripts eslint.config.mjs" and exits
  zero. After-cleanup inventory = 0.
- `make lint-eslint` exits zero after the change (only the pre-existing `*ByTestId` warnings
  from issue #90 remain).
- Recorded the after-cleanup inventory, before/after count table, and the zero-baseline
  decision in `eslint-suppressions-baseline.md`.

### File List

- `eslint.config.mjs`
- `specs/eslint-suppressions/implementation-artifacts/eslint-suppressions-baseline.md`
- `specs/eslint-suppressions/implementation-artifacts/2-5-record-after-cleanup-inventory-and-baseline-decision.md`

### Change Log

- 2026-06-10: Story 2.5 — dropped the deferred `eslint-comments/no-use` allow-list in
  `eslint.config.mjs` (rule now a bare `error`); reran the inventory (after-cleanup count =
  0); recorded the after-cleanup inventory, before/after counts, and the zero-baseline
  decision in `eslint-suppressions-baseline.md`.
