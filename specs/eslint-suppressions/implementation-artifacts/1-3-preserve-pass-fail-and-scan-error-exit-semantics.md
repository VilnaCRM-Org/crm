# Story 1.3: Preserve Pass, Fail, and Scan Error Exit Semantics

Status: done

## Story

As a maintainer,
I want the suppression inventory target to return reliable exit statuses,
so that it can be trusted locally and later considered for enforcement.

## Acceptance Criteria

1. Given `ESLINT_SUPPRESSION_SCAN_PATHS` points to a controlled fixture containing all four
   directive variants, when `make lint-eslint-suppressions ESLINT_SUPPRESSION_SCAN_PATHS=`
   `<positive-fixture>` runs, then the command exits non-zero, and the output includes all
   four directive variants.
2. Given `ESLINT_SUPPRESSION_SCAN_PATHS` points to a controlled fixture with no ESLint
   suppression, when `make lint-eslint-suppressions ESLINT_SUPPRESSION_SCAN_PATHS=`
   `<negative-fixture>` runs, then the command exits zero, and the output includes a short
   success message.
3. Given grep encounters a scan error other than no matches, when
   `make lint-eslint-suppressions` runs, then the target exits non-zero, and the
   implementation does not mask the error with unconditional success behaviour.

## Tasks / Subtasks

- [x] Task 1: Confirm the exit-code contract in the Makefile recipe (AC: 1, 2, 3)
  - [x] 1.1 grep status `0` (matches) reports a cleanup message and exits `1`
  - [x] 1.2 grep status `1` (no matches) reports a success message and exits `0`
  - [x] 1.3 grep status `>= 2` (scan error) propagates the status and is never masked
- [x] Task 2: Add Bats exit-semantics coverage (AC: 1, 2, 3)
  - [x] 2.1 Positive controlled fixture via override -> non-zero exit and all four variants
  - [x] 2.2 Negative controlled fixture via override -> zero exit and a success message
  - [x] 2.3 Simulated grep scan error (status `2`) -> non-zero exit, success message absent

## Dev Notes

- The exit-code contract was already implemented in Story 1.1's recipe; this story adds the
  dedicated regression coverage that pins the pass / fail / scan-error behaviour
  (architecture: Error Handling Patterns). No Makefile change was required.
- The scan-error case is exercised with a `grep` stub on the sandbox `PATH` that exits `2`,
  rather than a real unreadable path, so the test is deterministic and privilege-independent
  (a `chmod 000` fixture would not block a root user inside the dev container).
- A masking variant (`|| true` / unconditional success) was verified to fail the new
  scan-error test, confirming the assertion has teeth.
- `make` surfaces a recipe failure as exit status `2` whether the recipe exited `1` (matches)
  or `2` (scan error), so the Bats tests assert non-zero rather than a specific failing code.

## Dev Agent Record

### Agent Model Used

claude-opus-4-8

### Completion Notes List

- `tests/bats/eslint_suppressions.bats`: 8/8 pass; full Bats suite 24/24 pass, including the
  coverage-completeness contract that requires every Makefile target to be registered.
- No Makefile change required — the Story 1.1 exit-code contract already satisfies all three
  acceptance criteria; this story adds the missing scan-error regression test plus explicit
  override-based pass/fail coverage.

### File List

- `tests/bats/eslint_suppressions.bats`
- `specs/eslint-suppressions/implementation-artifacts/1-3-preserve-pass-fail-and-scan-error-exit-semantics.md`
- `.ralph/@fix_plan.md`

### Change Log

- 2026-06-10: Story 1.3 — added Bats exit-semantics coverage (positive and negative override
  fixtures and a simulated grep scan error) verifying that pass / fail / scan-error exit codes
  are preserved and never masked.
