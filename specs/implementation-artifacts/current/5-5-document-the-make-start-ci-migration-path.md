# Story 5.5: Document the `make start` / CI Migration Path

Status: review

## Story

As an existing contributor,
I want migration documentation for the changed `make start` behavior and the new CI command,
so that my existing mental model, local scripts, and aliases do not silently break after this
initiative lands.

## Acceptance Criteria

1. README explains that `make start` no longer means "frontend only" and now starts the full local
   stack, including Mockoon.
2. README and/or CONTRIBUTING give explicit migration guidance for contributors who previously ran
   older ad hoc CI command chains instead of `make ci`.
3. The migration guidance tells contributors to update aliases, scripts, and onboarding notes so
   local automation stays aligned with current Make target contracts.

## Tasks / Subtasks

- [x] Task 1: Add contributor-facing migration guidance for `make start` and `make ci` (AC: 1, 2, 3)
  - [x] 1.1 Clarify the new `make start` contract for existing contributors.
  - [x] 1.2 Point older CI wrappers and local command chains at `make ci`.
  - [x] 1.3 Call out aliases, scripts, and onboarding notes as migration surfaces.

## Dev Notes

### Architecture Decisions

- **Migration-doc scope:** This story is documentation-only and belongs in the existing contributor
  entrypoints, where day-to-day commands are already explained.
- **Dual-audience placement:** README carries the primary contributor migration note, while
  CONTRIBUTING reinforces the same guidance for maintainers updating onboarding or automation.
- **Contract continuity:** The guidance explicitly ties migration work back to the new Make target
  contracts so future documentation stays consistent with the workflow surface.

### Project Structure Notes

- **Primary files:** `README.md`, `CONTRIBUTING.md`
- **Supporting tracking artifact:** `specs/implementation-artifacts/current/sprint-status.yaml`

### Testing Approach

- Run markdown lint on the updated documentation files to verify the edits remain valid.

## Dev Agent Record

### Agent Model Used

gpt-5-codex

### Debug Log References

- Inspected the existing startup and CI sections in README and found that they described the new
  behavior but did not provide an explicit migration note for contributors with older assumptions.
- Added a migration section in README and a maintainer-facing migration reminder in CONTRIBUTING so
  both local usage and contributor workflow updates are covered.

### Completion Notes List

- Added a dedicated migration note for existing contributors in `README.md`.
- Documented how to migrate older local CI wrappers, aliases, and onboarding notes to `make ci`.
- Reinforced the new `make start` and `make ci` contracts in `CONTRIBUTING.md`.

### File List

- `README.md`
- `CONTRIBUTING.md`
- `specs/implementation-artifacts/current/5-5-document-the-make-start-ci-migration-path.md`
- `specs/implementation-artifacts/current/sprint-status.yaml`
