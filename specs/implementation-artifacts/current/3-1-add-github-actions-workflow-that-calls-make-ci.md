# Story 3.1: Add GitHub Actions Workflow That Calls make ci

Status: review

## Story

As a developer,
I want GitHub Actions to run `make ci`,
so that local and remote CI use the same check definition.

## Acceptance Criteria

1. A GitHub Actions workflow runs on pull requests to `main`.
2. The workflow calls `make ci`.
3. The workflow passes `CI=1`.
4. The workflow does not duplicate the lint or unit test target list in workflow YAML.
5. A non-zero `make ci` result fails the workflow.

## Tasks / Subtasks

- [x] Task 1: Lock the GitHub Actions contract with focused tooling coverage (AC: 1, 2, 3, 4)
  - [x] 1.1 Add a test that reads the workflow YAML from `.github/workflows/ci.yml`.
  - [x] 1.2 Assert the workflow triggers on pull requests to `main`.
  - [x] 1.3 Assert one workflow step delegates to `make ci`.
  - [x] 1.4 Assert the workflow passes `CI=1`.
  - [x] 1.5 Assert the YAML does not inline `make lint` or `make test-unit-all`.

- [x] Task 2: Add the new GitHub Actions workflow (AC: 1, 2, 3, 4, 5)
  - [x] 2.1 Create `.github/workflows/ci.yml`.
  - [x] 2.2 Keep the workflow thin by delegating directly to `make ci`.
  - [x] 2.3 Let GitHub Actions fail naturally when `make ci` exits non-zero.

## Dev Notes

### Architecture Decisions

- **Single source of truth:** The workflow delegates to the existing Make contract instead of
  restating lint or unit commands in YAML.
- **CI-specific setup via environment:** `CI=1` is passed at the workflow step so the Makefile can
  switch to the CI startup behavior without adding workflow-only branching elsewhere.
- **Pinned checkout action:** The workflow follows the repository's existing pattern of using the
  pinned `actions/checkout` SHA with read-only repository access.

### Project Structure Notes

- **Workflow file:** `.github/workflows/ci.yml`
- **Focused test file:** `tests/unit/tooling/github-actions-ci-workflow.test.ts`
- **Supporting tracking artifact:** `specs/implementation-artifacts/current/sprint-status.yaml`

### Testing Approach

- Use a focused tooling test that parses the workflow YAML and asserts only the contract required by
  this story.
- Re-run the existing `make ci` orchestration contract test to verify the workflow still delegates
  to a known, separately tested Make entrypoint.

### References

- Story spec: `specs/planning-artifacts/current/epics-start-ci-chromium-2026-04-14.md#story-3-1`
- Prior implementation: `specs/implementation-artifacts/current/2-4-add-top-level-make-ci-orchestration.md`

## Dev Agent Record

### Agent Model Used

gpt-5-codex

### Debug Log References

- Added the workflow contract test before the workflow existed and confirmed it failed with ENOENT
  for `.github/workflows/ci.yml`.
- Added the new workflow and re-ran the focused test until it passed.
- Re-ran the existing `make ci` contract test to verify the workflow still points at the canonical
  Make orchestration.

### Completion Notes List

- Added a new `ci` GitHub Actions workflow for pull requests to `main`.
- Passed `CI=1` to `make ci` without duplicating the lint or unit target list in YAML.
- Added focused tooling coverage to prevent drift away from the Make-based CI contract.

### File List

- `.github/workflows/ci.yml`
- `tests/unit/tooling/github-actions-ci-workflow.test.ts`
- `specs/implementation-artifacts/current/3-1-add-github-actions-workflow-that-calls-make-ci.md`
- `specs/implementation-artifacts/current/sprint-status.yaml`
