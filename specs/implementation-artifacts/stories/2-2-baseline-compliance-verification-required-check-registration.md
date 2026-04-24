# Story 2.2: Baseline Compliance Verification and Required Check Registration

Status: ready-for-review

## Story

As a maintainer,
I want to verify the current `main` branch passes `make lint-metrics` and register the workflow
as a required status check,
so that pull requests to `main` are blocked until the quality gate passes.

## Acceptance Criteria

1. After Epic 1 and Story 2.1 are complete, `make lint-metrics` is run against the current
   repository baseline.
2. Existing violations are addressed or thresholds are adjusted before enforcement is treated as
   blocking.
3. After `.github/workflows/rust-code-analysis.yml` has run at least once on `main`,
   `rust-code-analysis` appears as an available branch-protection status check.
4. The `rust-code-analysis` status check is enabled as required for `main`.
5. A pull request targeting `main` with threshold violations cannot be merged until
   `rust-code-analysis` passes.
6. A pull request targeting `main` with all metrics within thresholds shows
   `rust-code-analysis` as passing and is not blocked by this gate.

## Tasks / Subtasks

- [x] Task 1: Verify repository baseline (AC: 1, 2)
  - [x] 1.1 Run `make lint-metrics` against the current code state
  - [x] 1.2 Review any reported violations
  - [x] 1.3 Update the committed thresholds to the wider hard-fail and review-gate policy
  - [x] 1.4 Recalibrate hard-fail thresholds to the current repository baseline
  - [x] 1.5 Rerun `make lint-metrics` and confirm it exits `0`

- [x] Task 2: Preserve baseline policy in committed configuration (AC: 2)
  - [x] 2.1 Update `Makefile` threshold environment values passed into
        `scripts/lint-metrics.sh`
  - [x] 2.2 Update `scripts/lint-metrics.sh` default threshold values and comments
  - [x] 2.3 Update planning/story documentation where it names the current enforced policy

- [x] Task 3: Prepare required-check registration (AC: 3, 4)
  - [x] 3.1 Confirm the workflow job key remains exactly `rust-code-analysis`
  - [x] 3.2 Confirm `.github/workflows/rust-code-analysis.yml` is committed and can run on
        pull requests to `main`
  - [x] 3.3 Document that GitHub branch protection must use the check named
        `rust-code-analysis`
  - [x] 3.4 Confirm code-side readiness for enabling `rust-code-analysis` after the workflow
        appears in GitHub branch protection settings

- [x] Task 4: Verify pass/fail behavior (AC: 5, 6)
  - [x] 4.1 Confirm threshold violations make `scripts/lint-metrics.sh` exit `1` after
        printing all violations
  - [x] 4.2 Confirm passing metrics make `scripts/lint-metrics.sh` exit `0`
  - [x] 4.3 Confirm CI invokes the same `make lint-metrics` command used locally

- [x] Task 5: Verification (AC: 1-6)
  - [x] 5.1 Run `make lint-metrics` and capture the current baseline-calibrated result
  - [x] 5.2 Inspect workflow job name and cache behavior
  - [x] 5.3 Confirm required-check registration instructions are captured for maintainers
  - [x] 5.4 Confirm the current baseline passes before enabling the required check

## Dev Notes

### Architecture Decisions

**Baseline prerequisite:**

Branch protection should not be enabled until the current baseline passes. If initial target
thresholds create widespread failures, raise the committed thresholds to a passing baseline and
tighten them later in a separate PR.

**Current enforced policy:**

Hard-fail metrics use the configured hard-fail values from the architecture threshold table.
Review-gate metrics are silent and do not block CI.

Current baseline-calibrated result on 2026-04-16:

- `make lint-metrics` exits `0`
- Hard-fail findings: 0
- Review-gate findings are silent
- Target-quality tightening is deferred to a follow-up PR that changes application code.

**Branch protection dependency:**

GitHub only exposes a check as branch-protection selectable after the workflow has run at least
once on the target branch or a relevant pull request. The required check name must match the
workflow job key: `rust-code-analysis`.

**Repository permission boundary:**

The codebase can provide the workflow and documentation, but enabling branch protection is a
repository settings operation. The implementation artifact records that the repository is ready
for `rust-code-analysis` to be selected as required once GitHub exposes it.

### Project Structure Notes

- **Files modified:** `Makefile`, `scripts/lint-metrics.sh`,
  `specs/planning-artifacts/epics-rust-code-analysis-2026-03-11.md`,
  `specs/implementation-artifacts/stories/1-1-commit-repository-policy-configuration.md`
- **Dependent workflow:** `.github/workflows/rust-code-analysis.yml`
- **No application source changes** are required for this story.

### Testing Approach

Verification is operational:

- Run `make lint-metrics` against the current code state.
- Confirm the workflow job name remains `rust-code-analysis`.
- Confirm branch-protection setup uses the exact required-check name.
- Enable branch protection only after the workflow has run at least once and GitHub exposes the
  `rust-code-analysis` check in repository settings.
- Use future pull requests to validate GitHub's merge-blocking behavior once branch protection
  is enabled in repository settings.

### References

- Architecture: `specs/planning-artifacts/architecture-rust-code-analysis-2026-03-11.md`
  - Branch Protection Integration, Gap Analysis Results - Baseline Compliance Run
- Epics: `specs/planning-artifacts/epics-rust-code-analysis-2026-03-11.md` - Story 2.2
- PRD: `specs/planning-artifacts/prd-rust-code-analysis-2026-03-11.md`
  - FR1, FR2, FR3, FR4, FR10, FR12, FR13
- Previous story:
  `specs/implementation-artifacts/stories/2-1-github-actions-workflow-automated-analysis.md`

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

- Current policy uses the wider metric set requested on 2026-04-16, with hard-fail thresholds
  calibrated to the current repository baseline so this PR can pass.
- Strict target-quality values are intentionally deferred to a follow-up code-remediation PR.
- The required status check cannot be fully toggled from code; it must be enabled in GitHub
  branch protection settings after the workflow appears.

### Completion Notes List

- Updated Makefile and script defaults so local and CI enforcement use the same hard-fail and
  review-gate policy.
- Required-check registration is ready after the workflow has appeared in GitHub branch
  protection settings.
- Preserved `rust-code-analysis` as the exact workflow job key required for branch protection.
- Captured branch-protection registration dependency and exact check name in this artifact.

### File List

- `Makefile`
- `Dockerfile`
- `scripts/lint-metrics.sh`
- `tests/unit/scripts/lint-metrics.test.ts`
- `.github/workflows/rust-code-analysis.yml`
- `specs/planning-artifacts/epics-rust-code-analysis-2026-03-11.md`
- `specs/implementation-artifacts/stories/1-1-commit-repository-policy-configuration.md`
- `specs/implementation-artifacts/stories/2-2-baseline-compliance-verification-required-check-registration.md`

### Change Log

- 2026-04-16: Story 2.2 updated - required-check behavior now prints only blocking hard
  failures.
- 2026-04-16: Hard-fail thresholds recalibrated to the current repository baseline so
  `make lint-metrics` passes in this PR.
