# Story 3.2: Retire Redundant Static and Unit Workflows Safely

Status: review

## Story

As a maintainer,
I want obsolete workflow definitions retired only after required-check dependencies are handled,
so that CI consolidation does not break merges or silently remove protection.

## Acceptance Criteria

1. The redundant `.github/workflows/static-testing.yml` workflow is retired.
2. The redundant `.github/workflows/unit-testing.yml` workflow is retired.
3. The repository keeps the consolidated `ci` GitHub Actions job as the replacement required-check
   target for this CI slice.
4. The branch-protection migration dependency is recorded so maintainers update required checks in
   GitHub before depending on the workflow retirement in protected branches.

## Tasks / Subtasks

- [x] Task 1: Lock the workflow-retirement contract with focused tooling coverage (AC: 1, 2, 3)
  - [x] 1.1 Add a test that asserts the `ci.yml` workflow still exposes only the `ci` job.
  - [x] 1.2 Add a test that asserts `static-testing.yml` is absent.
  - [x] 1.3 Add a test that asserts `unit-testing.yml` is absent.

- [x] Task 2: Retire the redundant workflow files (AC: 1, 2, 3)
  - [x] 2.1 Remove `.github/workflows/static-testing.yml`.
  - [x] 2.2 Remove `.github/workflows/unit-testing.yml`.
  - [x] 2.3 Preserve `.github/workflows/ci.yml` as the consolidated replacement.

- [x] Task 3: Record the branch-protection migration dependency for maintainers (AC: 4)
  - [x] 3.1 Document that protected branches must switch required checks from the retired workflow
        job names to `ci`.
  - [x] 3.2 Document that this verification must happen in GitHub after the new workflow has run.

## Dev Notes

### Architecture Decisions

- **Single replacement check:** The repository now treats the `ci` workflow job as the only
  replacement for the retired static and unit workflow checks.
- **Code-side retirement only:** Branch protection cannot be changed from the repository working
  tree, so the local implementation records the mandatory maintainer follow-up instead of pretending
  the remote GitHub setting was updated automatically.
- **Thin scope:** This story only retires the redundant workflows and records the dependency; it
  does not expand the check surface beyond the `make ci` consolidation introduced in Story 3.1.

### Project Structure Notes

- **Retired workflows:** `.github/workflows/static-testing.yml`, `.github/workflows/unit-testing.yml`
- **Replacement workflow:** `.github/workflows/ci.yml`
- **Focused test file:** `tests/unit/tooling/github-actions-ci-retirement.test.ts`
- **Supporting tracking artifact:** `specs/implementation-artifacts/current/sprint-status.yaml`

### Testing Approach

- Use a focused tooling test to ensure the legacy workflow files are gone and the `ci` workflow job
  name remains exactly `ci`.
- Re-run the existing `ci.yml` workflow contract test to verify the consolidated workflow still
  delegates to `make ci` with `CI=1`.

### Maintainer Follow-up

- After this change lands, a maintainer must update GitHub branch protection required checks for
  `main` to use `ci` instead of the retired `static` and `unit` workflow job names.
- That GitHub-side verification is external to the repository and cannot be enforced from this local
  loop, so it is recorded here rather than faked in code.

## Dev Agent Record

### Agent Model Used

gpt-5-codex

### Debug Log References

- Added the retirement contract test before deleting the workflows and confirmed it failed because
  the legacy files still existed.
- Removed the two redundant workflow definitions and re-ran the focused retirement test until it
  passed.
- Re-ran the existing `ci.yml` contract test to confirm the replacement workflow still delegates to
  `make ci`.

### Completion Notes List

- Retired the legacy static and unit GitHub Actions workflows.
- Preserved `ci` as the consolidated replacement check in repository code.
- Recorded the required branch-protection migration step for maintainers.

### File List

- `.github/workflows/static-testing.yml` (deleted)
- `.github/workflows/unit-testing.yml` (deleted)
- `tests/unit/tooling/github-actions-ci-retirement.test.ts`
- `specs/implementation-artifacts/current/3-2-retire-redundant-static-and-unit-workflows-safely.md`
- `specs/implementation-artifacts/current/sprint-status.yaml`
