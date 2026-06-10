# Story 3.2: Publish Suppression Baseline and Enforcement Decision

Status: done

## Story

As a maintainer,
I want a concrete suppression baseline and enforcement decision artifact,
so that reviewers can use the MVP output without relying on future policy assumptions.

## Acceptance Criteria

1. Given Stories 2.1 through 2.5 have produced before-cleanup and after-cleanup inventory
   evidence, when the MVP is prepared for review, then
   `specs/eslint-suppressions/implementation-artifacts/eslint-suppressions-baseline.md` exists,
   and it includes the before-cleanup suppression count, and it includes the after-cleanup
   suppression count, and it includes any remaining suppression rationale.
2. Given the MVP suppression target remains standalone, when maintainers review the baseline
   artifact, then it states that `lint-eslint-suppressions` is standalone during MVP, and it
   states that aggregate `make lint` and CI enforcement are not changed in MVP.
3. Given the artifact records the current baseline, when reviewers need to evaluate suppression
   debt in this MVP or a later pull request, then the artifact provides the command used, scan
   scope, before/after counts, and remaining baseline entries or zero-baseline statement.
4. Given the repository has not reached an agreed enforcement policy, when maintainers review
   MVP completion, then the artifact records that future enforcement options are deferred, and
   no story requires CI enforcement or aggregate lint wiring as part of the MVP.

## Tasks / Subtasks

- [x] Task 1: Finalize the enforcement decision in the baseline artifact (AC: 2, 4)
  - [x] 1.1 Replace the "Status: in progress" line with "Status: complete" and point at the
        finalized Enforcement Decision section
  - [x] 1.2 Replace the placeholder "To be recorded in Story 3.2" Enforcement Decision section
        with the finalized standalone decision, stating that aggregate `make lint` and CI
        enforcement are not changed in MVP
  - [x] 1.3 Record that future enforcement options (aggregate-lint wiring, CI gate) are
        deferred and that no story requires them as part of the MVP
- [x] Task 2: Confirm the baseline artifact still carries the inventory evidence (AC: 1, 3)
  - [x] 2.1 Confirm the before-cleanup count (3), the after-cleanup count (0), the
        zero-baseline / remaining-suppression rationale, the command used, and the scan scope
        are all present in the artifact
- [x] Task 3: Cover the published baseline with Bats (AC: 1, 2, 3, 4)
  - [x] 3.1 Add a Bats test asserting the baseline artifact records the before/after counts,
        the command, the scan scope, the "Standalone during MVP" decision, the
        not-changed-in-MVP statement, the zero-baseline statement, and the deferred-future
        statement, and that the placeholder "To be recorded in Story 3.2" is gone

## Dev Notes

- The baseline artifact already existed from Stories 2.1–2.5: it carried the before-cleanup
  inventory (3 matches: 1 tooling, 1 source, 1 test), the staged cleanup notes, the
  after-cleanup inventory (0 matches), the before/after count table, the command, and the scan
  scope. The only Story 3.2 gap was the finalized enforcement decision — the file still read
  "Status: in progress" and the Enforcement Decision section said "To be recorded in Story
  3.2". This story closes that gap; it does not re-derive the counts.
- The locked MVP decision (see `.ralph/@AGENT.md` and the architecture artifact) is that the
  target stays standalone: not wired into aggregate `make lint` and not a CI gate. Story 3.1
  made the placement explicit in the Makefile; Story 3.2 records the matching enforcement
  decision and the deferred-future options in the baseline artifact so reviewers can act on the
  current output without relying on future policy assumptions.
- The standalone placement is a tested invariant, not just prose: aggregate `lint:` lists
  `lint-eslint lint-tsc lint-md lint-deps lint-metrics` and omits `lint-eslint-suppressions`,
  and `tests/bats/eslint_suppressions.bats` asserts the `lint:` line does not contain the
  target (Stories 1.1 and 3.1).
- This story is documentation-only and adds no runtime `src/` code, so the rust-code-analysis
  and integration-coverage gates are unaffected. The baseline markdown and the Bats file are
  outside the `src/` metrics scope.
- TDD: the new Bats test failed first (RED) on the finalized-decision assertions
  ("Standalone during MVP", the not-changed-in-MVP statement, and the deferred-future
  statement were absent while the placeholder text was present), then passed (GREEN) once the
  artifact's status line and Enforcement Decision section were finalized. The AC phrases were
  kept on single lines so the fixed-string assertions match and markdownlint's 100-character
  line limit still passes.

## Dev Agent Record

### Agent Model Used

claude-opus-4-8

### Completion Notes List

- Finalized the baseline artifact's status line from "in progress" to "complete".
- Replaced the placeholder Enforcement Decision section with the finalized decision: the target
  is standalone during MVP, aggregate `make lint` and CI enforcement are not changed in MVP,
  the accepted baseline is zero (so there are no remaining suppressions and no per-entry
  rationale), and future enforcement options (aggregate-lint wiring, CI gate) are deferred with
  no story requiring them as part of the MVP.
- Added a Bats test ("baseline artifact publishes counts and the finalized standalone
  enforcement decision") asserting the artifact exists and records the before/after counts, the
  command, the scan scope, the "Standalone during MVP" decision, the not-changed-in-MVP
  statement, the zero-baseline statement, and the deferred-future statement, and that the
  placeholder "To be recorded in Story 3.2" is gone.
- Full Bats suite is 10/10 green. `markdownlint` passes on the baseline artifact and this
  artifact.

### File List

- `specs/eslint-suppressions/implementation-artifacts/eslint-suppressions-baseline.md`
- `specs/eslint-suppressions/implementation-artifacts/3-2-publish-suppression-baseline-and-enforcement-decision.md`
- `tests/bats/eslint_suppressions.bats`
- `.ralph/@fix_plan.md`

### Change Log

- 2026-06-10: Story 3.2 — published the suppression baseline and enforcement decision.
  Finalized the enforcement decision in `eslint-suppressions-baseline.md` (standalone during
  MVP; aggregate `make lint` and CI enforcement unchanged; zero baseline; future enforcement
  options deferred) and added a Bats test covering the published counts and decision. Full Bats
  suite 10/10.
