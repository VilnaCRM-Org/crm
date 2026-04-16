# Story 2.1: GitHub Actions Workflow for Automated Analysis

Status: done

## Story

As a maintainer,
I want a dedicated GitHub Actions workflow that automatically runs `make lint-metrics` on every
pull request targeting `main`,
so that the repository enforces code quality policy on all incoming changes without manual
intervention.

## Acceptance Criteria

1. Pull requests opened or updated against `main` trigger
   `.github/workflows/rust-code-analysis.yml`.
2. The workflow contains a job named exactly `rust-code-analysis`.
3. The workflow uses `actions/cache` for the local RCA binary, with a cache key derived from
   the `RCA_VERSION` value in the Makefile.
4. If the cache hits, the cached binary can be reused by `make lint-metrics`; if the cache
   misses, `make lint-metrics` downloads and installs the pinned binary.
5. The job runs `make lint-metrics`, which analyzes the full governed `src/` scope against
   committed thresholds.
6. The job fails with exit code `1` and prints the violation table when thresholds are exceeded.
7. The job passes with exit code `0` and writes a passing Job Summary when all metrics pass.
8. The job name is exactly `rust-code-analysis` for branch protection registration.

## Tasks / Subtasks

- [x] Task 1: Create dedicated workflow (AC: 1, 2, 8)
  - [x] 1.1 Create `.github/workflows/rust-code-analysis.yml`
  - [x] 1.2 Set workflow name to `rust-code-analysis`
  - [x] 1.3 Trigger on `pull_request` events targeting `main`
  - [x] 1.4 Define the job key as `rust-code-analysis`
  - [x] 1.5 Run the job on `ubuntu-latest`

- [x] Task 2: Add repository checkout and version discovery (AC: 3)
  - [x] 2.1 Add `actions/checkout@v4`
  - [x] 2.2 Read `RCA_VERSION` from the Makefile with `awk`
  - [x] 2.3 Write the discovered version to `$GITHUB_OUTPUT`

- [x] Task 3: Add binary cache (AC: 3, 4)
  - [x] 3.1 Add `actions/cache@v4`
  - [x] 3.2 Cache path `./bin/rust-code-analysis-cli`
  - [x] 3.3 Use a key derived from the discovered `RCA_VERSION`
  - [x] 3.4 Let `make lint-metrics` perform install on cache miss

- [x] Task 4: Run the repository-owned quality gate (AC: 5, 6, 7)
  - [x] 4.1 Add a workflow step that runs `make lint-metrics`
  - [x] 4.2 Rely on the Makefile and `scripts/lint-metrics.sh` for scope, thresholds, exit code,
    stdout reporting, and Job Summary output

- [x] Task 5: Verification (AC: 1-8)
  - [x] 5.1 Confirm workflow trigger is `pull_request` to `main`
  - [x] 5.2 Confirm job key is exactly `rust-code-analysis`
  - [x] 5.3 Confirm cache key uses the Makefile-derived RCA version
  - [x] 5.4 Confirm the workflow invokes `make lint-metrics`, not the raw CLI

## Dev Notes

### Architecture Decisions

**Workflow boundary:**

- Workflow file: `.github/workflows/rust-code-analysis.yml`
- Workflow name: `rust-code-analysis`
- Job key: `rust-code-analysis`
- Trigger: `pull_request` targeting `main`
- Runner: `ubuntu-latest`

**Required-check name:**

The job name must remain exactly `rust-code-analysis` because Story 2.2 registers that status
check in branch protection.

**Local/CI parity:**

CI must call `make lint-metrics`. It must not call `rust-code-analysis-cli` directly and must
not duplicate thresholds, scope, or reporting logic in YAML.

**Cache key design:**

The workflow reads `RCA_VERSION` from the Makefile and uses it in the cache key. This preserves
the Makefile as the single version source of truth while allowing binary cache invalidation on
version changes.

**Cache miss behavior:**

The workflow does not need a separate install step. `make lint-metrics` owns binary installation
and validates the installed version. On a cache miss, that target downloads the pinned release
asset into `./bin/`.

### Project Structure Notes

- **New file:** `.github/workflows/rust-code-analysis.yml`
- **Dependent files:** `Makefile`, `scripts/lint-metrics.sh`
- **No application source changes** are required for this story.

### Testing Approach

Verification is workflow-structure based plus functional coverage through `make lint-metrics`:

- Inspect `.github/workflows/rust-code-analysis.yml` for trigger, job name, cache, and command.
- Run `make lint-metrics` locally or in the dev container to validate the command the workflow
  executes.
- GitHub Actions execution validates the pull request event path and Job Summary integration.

### References

- Architecture: `specs/planning-artifacts/architecture-rust-code-analysis-2026-03-11.md`
  - CI Job Structure, Integration Points, Branch Protection Integration
- Epics: `specs/planning-artifacts/epics-rust-code-analysis-2026-03-11.md` - Story 2.1
- PRD: `specs/planning-artifacts/prd-rust-code-analysis-2026-03-11.md`
  - FR1, FR3, FR4, FR9, FR10, FR12, FR13
- Previous story:
  `specs/implementation-artifacts/stories/1-2-make-lint-metrics-target-full-enforcement-reporting.md`

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

- The workflow derives `RCA_VERSION` with `awk -F'= '` from the Makefile instead of hardcoding
  `0.0.25` in YAML.
- Binary installation remains in `make lint-metrics`; workflow caching is an optimization only.

### Completion Notes List

- Added a dedicated `rust-code-analysis` workflow for pull requests to `main`.
- Added Makefile-derived RCA version discovery and cache key generation.
- Added `actions/cache@v4` for `./bin/rust-code-analysis-cli`.
- Workflow invokes `make lint-metrics` as the single policy entry point.

### File List

- `.github/workflows/rust-code-analysis.yml`
- `Makefile`
- `scripts/lint-metrics.sh`
- `specs/implementation-artifacts/stories/2-1-github-actions-workflow-automated-analysis.md`

### Change Log

- 2026-04-15: Story 2.1 implemented - dedicated GitHub Actions workflow with version-derived
  binary cache and `make lint-metrics` execution.
