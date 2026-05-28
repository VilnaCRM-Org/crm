# Story 5.2: Document make ci Usage and GNU Make Prerequisite

Status: review

## Story

As a developer,
I want README and CONTRIBUTING guidance for `make ci`,
so that I can run the same check command locally that GitHub Actions runs.

## Acceptance Criteria

1. README documents `make ci` as the canonical local pre-push validation command.
2. CONTRIBUTING documents `make ci` as the canonical local pre-push validation command.
3. The docs state that GitHub Actions delegates to `make ci`.
4. The docs describe GNU Make 4.0+ as a requirement.
5. The docs include a macOS Homebrew install path for GNU Make.
6. The docs summarize the `make ci` phases at a user-facing level.

## Tasks / Subtasks

- [x] Task 1: Document the `make ci` workflow in the README (AC: 1, 3, 4, 5, 6)
  - [x] 1.1 Add GNU Make 4.0+ to the prerequisites.
  - [x] 1.2 Add the macOS Homebrew install note.
  - [x] 1.3 Document `make ci` as the canonical local CI command.
  - [x] 1.4 Document that GitHub Actions delegates to `make ci`.
  - [x] 1.5 Summarize the CI phases at a user-facing level.

- [x] Task 2: Document the `make ci` workflow in CONTRIBUTING (AC: 2, 3, 4, 5, 6)
  - [x] 2.1 Add GNU Make 4.0+ and the macOS Homebrew note to the local setup guidance.
  - [x] 2.2 Add `make ci` as the command contributors should run before opening a PR.
  - [x] 2.3 Summarize the CI phases at a user-facing level.

## Dev Notes

### Architecture Decisions

- **Docs-only scope:** This story documents the CI entrypoint that already exists in the Makefile
  and GitHub Actions workflow.
- **Single CI command:** The docs now direct contributors to `make ci` instead of separate manual
  check lists, matching the repository’s canonical local/remote CI path.
- **Compatibility note:** GNU Make 4.0+ is documented explicitly because macOS commonly ships an
  older default Make implementation.

### Project Structure Notes

- **Primary files:** `README.md`, `CONTRIBUTING.md`
- **Supporting verification target:** `tests/unit/tooling/ci.test.ts`
- **Supporting tracking artifact:** `specs/implementation-artifacts/current/sprint-status.yaml`

### Testing Approach

- Run markdown lint on `README.md` and `CONTRIBUTING.md`.
- Re-run the existing `make ci` dry-run tooling contract test so the documentation still matches
  the implemented top-level CI entrypoint.

## Dev Agent Record

### Agent Model Used

gpt-5-codex

### Debug Log References

- Inspected `README.md` and `CONTRIBUTING.md` and confirmed neither file documented `make ci`.
- Confirmed the Makefile already exposes the `ci` target and phase sequence, so this story only
  needed documentation updates.
- Added the GNU Make requirement and the Homebrew note because the story explicitly calls out the
  macOS compatibility case.

### Completion Notes List

- Documented `make ci` as the canonical local and GitHub Actions CI entrypoint.
- Added GNU Make 4.0+ guidance, including the macOS Homebrew install path.
- Added a user-facing summary of the CI phases in both README and CONTRIBUTING.

### File List

- `README.md`
- `CONTRIBUTING.md`
- `specs/implementation-artifacts/current/5-2-document-make-ci-usage-and-gnu-make-prerequisite.md`
- `specs/implementation-artifacts/current/sprint-status.yaml`
