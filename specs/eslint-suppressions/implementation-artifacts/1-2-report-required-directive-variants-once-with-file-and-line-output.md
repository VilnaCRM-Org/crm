# Story 1.2: Report Required Directive Variants Once With File and Line Output

Status: done

## Story

As a contributor,
I want suppression matches reported with exact file and line references,
so that I can use the output as a cleanup queue.

## Acceptance Criteria

1. Given an in-scope file contains `eslint-disable`, when `make lint-eslint-suppressions`
   runs, then the directive is reported in grep-style `path:line:matched text` format.
2. Given an in-scope file contains `eslint-disable-next-line`, when the target runs, then the
   directive is reported once — not as both `eslint-disable-next-line` and `eslint-disable`.
3. Given an in-scope file contains `eslint-disable-line`, when the target runs, then the
   directive is reported in grep-style format, and it is reported once.
4. Given an in-scope file contains `eslint-enable`, when the target runs, then the directive
   is reported in grep-style `path:line:matched text` format.

## Tasks / Subtasks

- [x] Task 1: Verify single-report semantics of the locked pattern (AC: 2, 3)
  - [x] 1.1 Confirm the `[^[:alnum:]_-]` boundary class prevents `eslint-disable` from
        matching inside `eslint-disable-next-line` / `eslint-disable-line`
  - [x] 1.2 Confirm grep's line-based output reports each matching line exactly once
- [x] Task 2: Lock variant uniqueness with a regression test (AC: 1-4)
  - [x] 2.1 Add a Bats test placing all four directive variants on distinct lines of one
        fixture file and asserting exactly four reported entries, one per variant, each in
        grep-style `path:line:matched text` format

## Dev Notes

- The reporting behavior itself shipped with Story 1.1 (single `grep -rnE` pass); this story
  adds the explicit regression lock for the "reported once" requirement, which the existing
  scope test did not isolate.
- POSIX leftmost-longest matching plus the boundary class make double-counting impossible;
  the new test guards against future pattern edits regressing that property.

## Dev Agent Record

### Agent Model Used

claude-opus-4-8 at xhigh effort

### Completion Notes List

- Suppression Bats suite: 6/6 pass after the new test.
- Full Bats suite: 22/22 pass, coverage-completeness contract still green.

### File List

- `tests/bats/eslint_suppressions.bats`
- `specs/eslint-suppressions/implementation-artifacts/1-2-report-required-directive-variants-once-with-file-and-line-output.md`

### Change Log

- 2026-06-10: Story 1.2 implemented — variant-uniqueness regression test added; pattern
  semantics verified against all four directive forms.
