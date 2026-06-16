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
2. Given the suppression target stays standalone (not part of aggregate `make lint`), when
   maintainers review the baseline artifact, then it states that `lint-eslint-suppressions`
   is standalone but CI-enforced, and it states that the scan is enforced as a dedicated CI
   gate while aggregate `make lint` is unchanged.
3. Given the artifact records the current baseline, when reviewers need to evaluate suppression
   debt in this MVP or a later pull request, then the artifact provides the command used, scan
   scope, before/after counts, and remaining baseline entries or zero-baseline statement.
4. Given the repository has reached a zero baseline, when maintainers review the enforcement
   decision, then the artifact records that CI enforcement is adopted via a dedicated
   workflow, and that aggregate `make lint` wiring remains the deferred future option.

## Tasks / Subtasks

- [x] Task 1: Finalize the enforcement decision in the baseline artifact (AC: 2, 4)
  - [x] 1.1 Replace the "Status: in progress" line with "Status: complete" and point at the
        finalized Enforcement Decision section
  - [x] 1.2 Replace the placeholder "To be recorded in Story 3.2" Enforcement Decision section
        with the finalized decision: the target is standalone but CI-enforced (a dedicated CI
        gate), while aggregate `make lint` is unchanged
  - [x] 1.3 Record that CI enforcement is adopted via a dedicated workflow and that aggregate
        `make lint` wiring remains the deferred future option
- [x] Task 2: Confirm the baseline artifact still carries the inventory evidence (AC: 1, 3)
  - [x] 2.1 Confirm the before-cleanup count (3), the after-cleanup count (0), the
        zero-baseline / remaining-suppression rationale, the command used, and the scan scope
        are all present in the artifact
- [x] Task 3: Cover the published baseline with Bats (AC: 1, 2, 3, 4)
  - [x] 3.1 Add a Bats test asserting the baseline artifact records the before/after counts,
        the command, the scan scope, the "standalone but CI-enforced" decision, the
        dedicated-CI-gate statement, the zero-baseline statement, and that aggregate
        `make lint` wiring remains deferred, and that the placeholder "To be recorded in
        Story 3.2" is gone

## Dev Notes

- The baseline artifact already existed from Stories 2.1–2.5: it carried the before-cleanup
  inventory (3 matches: 1 tooling, 1 source, 1 test), the staged cleanup notes, the
  after-cleanup inventory (0 matches), the before/after count table, the command, and the scan
  scope. The only Story 3.2 gap was the finalized enforcement decision — the file still read
  "Status: in progress" and the Enforcement Decision section said "To be recorded in Story
  3.2". This story closes that gap; it does not re-derive the counts.
- The architecture artifact (under `planning-artifacts/`) deferred CI enforcement until the
  repository reached an agreed baseline; with the baseline now zero, this PR adopts the scan as
  a dedicated CI gate (`.github/workflows/eslint-suppressions.yml`) while keeping the target out
  of aggregate `make lint`. Story 3.1 made the standalone placement explicit in the Makefile;
  Story 3.2 records the finalized decision — CI gate adopted, aggregate `make lint` wiring still
  deferred — in the baseline artifact so reviewers can act on the current output.
- The standalone placement is a tested invariant, not just prose: aggregate `lint:` lists
  `lint-eslint lint-tsc lint-md lint-deps lint-metrics` and omits `lint-eslint-suppressions`,
  and `tests/bats/eslint_suppressions.bats` asserts the `lint:` line does not contain the
  target (Stories 1.1 and 3.1).
- This story is documentation-only and adds no runtime `src/` code, so the rust-code-analysis
  and integration-coverage gates are unaffected. The baseline markdown and the Bats file are
  outside the `src/` metrics scope.
- TDD: the new Bats test failed first (RED) on the finalized-decision assertions
  ("standalone but CI-enforced", the dedicated-CI-gate statement, and the
  aggregate-`make lint`-wiring-deferred statement were absent while the placeholder text was
  present), then passed (GREEN) once the artifact's status line and Enforcement Decision section
  were finalized. The AC phrases were kept on single lines so the fixed-string assertions match
  and markdownlint's 100-character line limit still passes.

## Dev Agent Record

### Agent Model Used

claude-opus-4-8

### Completion Notes List

- Finalized the baseline artifact's status line from "in progress" to "complete".
- Replaced the placeholder Enforcement Decision section with the finalized decision: the target
  is standalone but CI-enforced via a dedicated workflow, aggregate `make lint` is unchanged
  (its wiring stays deferred), and the accepted baseline is zero (so there are no remaining
  suppressions and no per-entry rationale).
- Added a Bats test ("baseline artifact publishes counts and the finalized standalone
  enforcement decision") asserting the artifact exists and records the before/after counts, the
  command, the scan scope, the "standalone but CI-enforced" decision, the dedicated-CI-gate
  statement, the zero-baseline statement, and that aggregate `make lint` wiring remains
  deferred, and that the placeholder "To be recorded in Story 3.2" is gone.
- The `eslint_suppressions` Bats file is 10/10 green (9 prior + 1 new); the full Bats suite
  is 26/26 green. `markdownlint` passes on the baseline artifact and this artifact.

### File List

- `.github/workflows/eslint-suppressions.yml`
- `specs/eslint-suppressions/implementation-artifacts/eslint-suppressions-baseline.md`
- `specs/eslint-suppressions/implementation-artifacts/3-2-publish-suppression-baseline-and-enforcement-decision.md`
- `tests/bats/eslint_suppressions.bats`

### Change Log

- 2026-06-10: Story 3.2 — published the suppression baseline and enforcement decision.
  Finalized the enforcement decision in `eslint-suppressions-baseline.md` (standalone during
  MVP; aggregate `make lint` and CI enforcement unchanged; zero baseline; future enforcement
  options deferred) and added a Bats test covering the published counts and decision. Full Bats
  suite 26/26 (the `eslint_suppressions` file is 10/10).
- 2026-06-16: Revised the enforcement decision to adopt CI enforcement. Added the dedicated
  `eslint-suppressions` workflow (`.github/workflows/eslint-suppressions.yml`) running
  `make lint-eslint-suppressions` on pull requests, updated the baseline artifact's Enforcement
  Decision (standalone but CI-enforced; aggregate `make lint` wiring still deferred), and
  updated the Bats AC2/AC4 assertions to match. The target stays out of aggregate `make lint`.
