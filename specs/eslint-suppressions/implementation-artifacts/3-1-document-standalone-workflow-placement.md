# Story 3.1: Document Standalone Workflow Placement

Status: done

## Story

As a maintainer,
I want the suppression check's workflow placement to be explicit,
so that contributors understand whether it is standalone or part of broader lint enforcement.

## Acceptance Criteria

1. Given the MVP suppression inventory target is implemented, when a maintainer reviews the
   Makefile or implementation notes, then it is clear that `lint-eslint-suppressions` is
   standalone during MVP, and aggregate `make lint` remains unchanged unless a later baseline
   decision explicitly changes it.
2. Given a contributor wants to run the suppression check directly, when they run
   `make lint-eslint-suppressions`, then the target runs independently of aggregate
   `make lint`.
3. Given the team later decides to wire the target into aggregate lint, when `make lint` is
   updated, then both `make lint-eslint-suppressions` and aggregate `make lint` are validated.

## Tasks / Subtasks

- [x] Task 1: Make the standalone placement explicit in the Makefile (AC: 1, 2)
  - [x] 1.1 Confirm the `lint-eslint-suppressions` help text marks it standalone and not part
        of `make lint`
  - [x] 1.2 Confirm the policy comment states it is standalone during MVP and that aggregate
        `lint` stays unchanged until the baseline decision changes it
  - [x] 1.3 Confirm aggregate `lint:` prerequisites do not include `lint-eslint-suppressions`
- [x] Task 2: Record forward-looking guidance for future aggregate-lint wiring (AC: 3)
  - [x] 2.1 Extend the Makefile policy comment so a maintainer who later wires the target into
        aggregate `lint` knows to add it to the `lint:` prerequisites and update the Bats
        placement test so both the standalone target and aggregate `lint` stay validated
- [x] Task 3: Cover the placement documentation with Bats (AC: 1, 2, 3)
  - [x] 3.1 Add a placement-documentation test asserting the standalone help text, the
        "Standalone during MVP" comment, and the future-wiring guidance phrase exist
  - [x] 3.2 Verify `make lint-eslint-suppressions` runs independently and exits zero, and that
        the existing placement test still asserts aggregate `lint:` excludes the target

## Dev Notes

- Placement is enforced by the Makefile structure, not just prose: aggregate `lint:` lists
  `lint-eslint lint-tsc lint-md lint-deps lint-metrics` and intentionally omits
  `lint-eslint-suppressions`. The existing placement test
  (`tests/bats/eslint_suppressions.bats`) already asserts the `lint:` line does not contain
  `lint-eslint-suppressions`, so AC1's "aggregate `make lint` remains unchanged" is a tested
  invariant — not just documentation.
- AC1 and AC2 were already satisfied before this story: the help text reads
  "(standalone; not part of `make lint`)" and the policy comment opens with
  "Standalone during MVP". The only gap was AC3 — the forward-looking guidance for when the
  baseline decision later wires the target into aggregate lint had not been recorded anywhere.
- This story is documentation-only and adds no runtime `src/` code, so the rust-code-analysis
  and integration-coverage gates are unaffected. The Makefile and Bats files are outside the
  `src/` metrics scope.
- The placement decision keeps the target standalone: it is intentionally not wired into
  aggregate `make lint`. (CI enforcement, originally deferred, was later adopted as a dedicated
  workflow — see Story 3.2 and the baseline artifact's Enforcement Decision.) Story 3.1 makes
  the standalone `make lint` placement explicit; Story 3.2 finalizes the enforcement decision
  in `eslint-suppressions-baseline.md`.
- TDD: the new placement-documentation test failed first on the AC3 future-wiring assertion
  (RED), then passed once the Makefile policy comment recorded that guidance (GREEN).

## Dev Agent Record

### Agent Model Used

claude-opus-4-8

### Completion Notes List

- Extended the `lint-eslint-suppressions` policy comment in `Makefile` to state the target is
  run directly and stays independent of `make lint`, and to record the future-wiring guidance:
  if a later baseline decision wires it into aggregate `lint`, add it to the `lint:`
  prerequisites and update the Bats placement test so both stay validated (AC3).
- Added a Bats placement-documentation test
  ("Makefile documents the standalone workflow placement and future-wiring guidance")
  asserting the standalone help text, the "Standalone during MVP" comment, and the
  future-wiring guidance phrase.
- Verified `make lint-eslint-suppressions` runs independently and exits zero (0 matches), and
  that aggregate `lint:` prerequisites still omit the target.
- Full Bats suite is 25/25 green (24 prior + 1 new placement-documentation test).

### File List

- `Makefile`
- `tests/bats/eslint_suppressions.bats`
- `specs/eslint-suppressions/implementation-artifacts/3-1-document-standalone-workflow-placement.md`

### Change Log

- 2026-06-10: Story 3.1 — recorded the standalone workflow placement explicitly. Extended the
  Makefile suppression-policy comment with direct-run and future-wiring guidance (AC3), and
  added a Bats placement-documentation test covering the standalone help text, the
  "Standalone during MVP" comment, and the future-wiring guidance. Full Bats suite 25/25.
