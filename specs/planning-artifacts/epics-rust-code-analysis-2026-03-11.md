---
stepsCompleted: [1, 2, 3, 4]
status: 'complete'
inputDocuments:
  - "specs/planning-artifacts/prd-rust-code-analysis-2026-03-11.md"
  - "specs/planning-artifacts/architecture-rust-code-analysis-2026-03-11.md"
---

# crm - Epic Breakdown

## Overview

This document provides the complete epic and story breakdown for crm, decomposing the requirements from the PRD and Architecture into implementable stories.

## Requirements Inventory

### Functional Requirements

FR1: The repository can execute `rust-code-analysis` automatically in CI for pull requests targeting `main`.
FR2: A pull request targeting `main` can surface a required `rust-code-analysis` result as part of repository quality policy.
FR3: The required `rust-code-analysis` result can fail when governed-scope results exceed the committed repository thresholds.
FR4: The required `rust-code-analysis` result can evaluate the full governed repository scope on each pull request.
FR5: The repository can keep unsupported or ambiguous assets outside the enforced governed scope.
FR6: Contributors can run the repository-defined `rust-code-analysis` check locally through a `make` target.
FR7: Contributors can use the local check to evaluate the same committed repository policy before marking a pull request ready for review.
FR8: Contributors can identify from a failed check which file, function, and metric violated repository policy.
FR9: CI runs can produce human-readable output for both successful and failed `rust-code-analysis` evaluations.
FR10: Successful CI runs can report actual metric values for the governed scope in the CI job output.
FR11: Failed CI runs can report policy violations clearly enough for contributors to remediate them without interpreting raw tool internals.
FR12: CI and local execution can evaluate `rust-code-analysis` results against the same committed repository thresholds.
FR13: CI and local execution can apply the same committed governed-scope definition.
FR14: Contributors can access repository documentation describing what the `rust-code-analysis` check enforces.
FR15: Contributors can access repository documentation describing how to run the check locally through `make`.
FR16: Contributors can access repository documentation describing how to interpret check failures and successful CI summaries.

### NonFunctional Requirements

NFR1: Reliability — Repeated evaluations against the same code state and committed policy must not produce materially inconsistent pass/fail outcomes.
NFR2: Consistency — Local (`make lint-metrics`) and CI execution must evaluate materially the same governed scope against the same committed thresholds.
NFR3: Usability — CI output and failure messages must be understandable for routine contributor and maintainer use without requiring interpretation of raw tool internals.
NFR4: Performance — The check must be operationally acceptable for routine pull request use (no fixed numeric execution-time target imposed).

### Additional Requirements

- No starter template applies — this is a brownfield extension of the existing `crm` repository.
- Tool: `rust-code-analysis-cli` v0.0.25, downloaded to `./bin/` (gitignored), self-installing in `lint-metrics` target if absent.
- Download URL pattern: `https://github.com/mozilla/rust-code-analysis/releases/download/v$(RCA_VERSION)/rust-code-analysis-cli-x86_64-unknown-linux-gnu.tar.gz`
- Version pinned via `RCA_VERSION = 0.0.25` in Makefile — single source of truth.
- Thresholds inline in Makefile: CC max 10, Cognitive Complexity max 15, NArgs max 5, NExits max 4, MI min 65, SLOC max 50.
- Governed scope: `src/` only. Excluded: `node_modules/`, `dist/`, `coverage/`, `.storybook/`, `tests/`.
- Enforcement mode: collect-all-then-fail via `jq` parsing JSON output — never fail-fast.
- CI workflow file: `.github/workflows/rust-code-analysis.yml`, job name `rust-code-analysis`, trigger: `pull_request` → `main`.
- Reporting: stdout violations table + `$GITHUB_STEP_SUMMARY` (null-guarded for local runs).
- File delta: 2 new items: 1 new file (`rust-code-analysis.yml`) and 1 new directory (`bin/`) (gitignored), 2 modified (`Makefile`, `.gitignore`), 1 docs section added.
- Baseline compliance run against current `main` required before enabling as required check in branch protection.
- `lint-metrics` added to existing `lint` chain: `lint: lint-eslint lint-tsc lint-md lint-metrics`.

### FR Coverage Map

FR1: Epic 2 — CI automation trigger on pull_request → main
FR2: Epic 2 — Required status check registration in branch protection
FR3: Epic 1 — Threshold enforcement logic (local); reinforced in Epic 2 (CI)
FR4: Epic 2 — Full governed scope evaluated on each CI run
FR5: Epic 1 — Governed scope exclusions committed in Makefile
FR6: Epic 1 — `make lint-metrics` target
FR7: Epic 1 — Same committed policy applied locally as in CI
FR8: Epic 1 — Violation output: file, function, metric, value, threshold
FR9: Epic 1 — Human-readable output for both success and failure paths
FR10: Epic 2 — GitHub Actions Job Summary with passing metric values
FR11: Epic 1 — Actionable violation table (collect-all-then-fail)
FR12: Epic 1+2 — Committed thresholds used by both local and CI execution
FR13: Epic 1+2 — Committed scope definition used by both local and CI execution
FR14: Epic 3 — Documentation: what the check enforces
FR15: Epic 3 — Documentation: how to run locally via `make lint-metrics`
FR16: Epic 3 — Documentation: how to interpret failures and passing summaries

## Epic List

### Epic 1: Local Code Quality Gate

Contributors can run `make lint-metrics` locally and receive actionable feedback identifying exactly which file, function, and metric violated policy — before pushing.
**FRs covered:** FR3, FR5, FR6, FR7, FR8, FR9, FR11, FR12, FR13

### Epic 2: Automated CI Enforcement

Pull requests to `main` are automatically evaluated and blocked when policy thresholds are exceeded, with metric values published on passing runs.
**FRs covered:** FR1, FR2, FR4, FR10 (FR3, FR9, FR12, FR13 reinforced from CI side)

### Epic 3: Contributor Documentation

Contributors can self-serve to understand what the gate enforces, how to run it locally, and how to interpret failures and passing summaries.
**FRs covered:** FR14, FR15, FR16

## Epic 1: Local Code Quality Gate Details

Contributors can run `make lint-metrics` locally and receive actionable feedback identifying exactly which file, function, and metric violated policy — before pushing.

### Story 1.1: Commit Repository Policy Configuration

As a maintainer,
I want the tool version, thresholds, and governed scope committed in the repository,
So that all contributors and CI execution paths evaluate against identical policy.

**Acceptance Criteria:**

**Given** the repository `Makefile` is opened
**When** a contributor inspects the file
**Then** `RCA_VERSION = 0.0.25` and `RCA_BIN = ./bin/rust-code-analysis-cli` are defined as variables
**And** inline threshold values are present: CC max 10, Cognitive max 15, NArgs max 5, NExits max 4, MI min 65, SLOC max 50

**Given** the repository `.gitignore` is opened
**When** a contributor inspects the file
**Then** `/bin/` is listed as an ignored entry
**And** the `./bin/` directory is not tracked by git

**Given** the Makefile threshold and scope definitions exist
**When** both local and CI execution paths invoke the analysis
**Then** both use the identical `RCA_VERSION` variable as the single source of truth
**And** the governed scope (`src/` only, with exclusions for `node_modules/`, `dist/`, `coverage/`, `.storybook/`, `tests/`) is defined in one place

### Story 1.2: `make lint-metrics` Target with Full Enforcement and Reporting

As a contributor,
I want to run `make lint-metrics` and receive a complete list of all policy violations with file, function, metric, value, and threshold details,
So that I can identify and fix every issue in a single local run before pushing.

**Acceptance Criteria:**

**Given** `./bin/rust-code-analysis-cli` does not exist
**When** a contributor runs `make lint-metrics` for the first time
**Then** the binary is automatically downloaded from the pinned `RCA_VERSION` GitHub release URL
**And** the binary is installed to `./bin/rust-code-analysis-cli`
**And** analysis proceeds without any additional manual steps

**Given** the `lint-metrics` target is invoked
**When** the analysis runs
**Then** only `src/` is analyzed
**And** `node_modules/`, `dist/`, `coverage/`, `.storybook/`, and `tests/` are excluded

**Given** one or more functions in `src/` exceed a threshold
**When** `make lint-metrics` completes
**Then** a violation table is printed to stdout showing: file path, function name, metric name, actual value, and threshold
**And** ALL violations are reported before the process exits (collect-all-then-fail)
**And** the exit code is `1`

**Given** all functions in `src/` are within all thresholds
**When** `make lint-metrics` completes
**Then** a success summary is printed showing the passing metric values
**And** the exit code is `0`

**Given** the `$GITHUB_STEP_SUMMARY` environment variable is set (CI environment)
**When** `make lint-metrics` completes
**Then** the summary or violation table is also written to `$GITHUB_STEP_SUMMARY`

**Given** `$GITHUB_STEP_SUMMARY` is NOT set (local environment)
**When** `make lint-metrics` completes
**Then** the target completes without error related to the missing variable

**Given** `make lint` is invoked
**When** all lint targets run
**Then** `lint-metrics` runs as part of the chain: `lint-eslint lint-tsc lint-md lint-metrics`

## Epic 2: Automated CI Enforcement Details

Pull requests to `main` are automatically evaluated and blocked when policy thresholds are exceeded, with metric values published on passing runs.

### Story 2.1: GitHub Actions Workflow for Automated Analysis

As a maintainer,
I want a dedicated GitHub Actions workflow that automatically runs `make lint-metrics` on every pull request targeting `main`,
So that the repository enforces code quality policy on all incoming changes without manual intervention.

**Acceptance Criteria:**

**Given** a pull request is opened or updated targeting `main`
**When** GitHub Actions evaluates the event
**Then** the `rust-code-analysis.yml` workflow is triggered
**And** a job named `rust-code-analysis` runs

**Given** the workflow job starts
**When** the binary cache is checked
**Then** `actions/cache` is used with a key derived from `RCA_VERSION`
**And** if the cache hits, no download occurs
**And** if the cache misses, the binary is downloaded from the pinned release URL and cached

**Given** the binary is available
**When** the job runs `make lint-metrics`
**Then** the full `src/` scope is analyzed against committed thresholds
**And** the job exits with code `1` and prints the violation table if any threshold is exceeded
**And** the job exits with code `0` and writes a passing summary to the GitHub Actions Job Summary if all metrics pass

**Given** the workflow file is committed
**When** the job name is inspected
**Then** the job name is exactly `rust-code-analysis` (required for branch protection check registration)

### Story 2.2: Baseline Compliance Verification and Required Check Registration

As a maintainer,
I want to verify the current `main` branch passes `make lint-metrics` and register the workflow as a required status check,
So that pull requests to `main` are blocked until the quality gate passes.

**Acceptance Criteria:**

**Given** Epic 1 and Story 2.1 are complete
**When** a maintainer runs `make lint-metrics` against the current `main` branch
**Then** the output is reviewed and any existing violations are addressed or thresholds adjusted before enabling enforcement

**Given** the `rust-code-analysis.yml` workflow has been triggered at least once on `main`
**When** a maintainer opens repository Settings → Branches → branch protection rules for `main`
**Then** `rust-code-analysis` appears as an available status check
**And** it is enabled as a required status check

**Given** the required check is enabled
**When** a pull request is opened targeting `main` with threshold violations
**Then** the PR cannot be merged until the `rust-code-analysis` check passes

**Given** the required check is enabled
**When** a pull request is opened targeting `main` with all metrics within thresholds
**Then** the `rust-code-analysis` check shows as passing and does not block the merge

## Epic 3: Contributor Documentation Details

Contributors can self-serve to understand what the gate enforces, how to run it locally, and how to interpret failures and passing summaries.

### Story 3.1: Contributor Documentation for Code Quality Gate

As a contributor,
I want clear repository documentation explaining what `rust-code-analysis` enforces, how to run it locally, and how to read the output,
So that I can use the quality gate as part of my normal workflow without needing to interpret raw tool internals.

**Acceptance Criteria:**

**Given** a contributor opens `CLAUDE.md`
**When** they look for information about code quality checks
**Then** a dedicated section under **Code Quality** explains what `rust-code-analysis` enforces and why
**And** the six enforced metrics are listed with their thresholds and a plain-language description of what each measures

**Given** a contributor wants to run the check locally
**When** they follow the documentation
**Then** `make lint-metrics` is documented as the single command to run
**And** no additional setup steps beyond what the repository already requires are needed

**Given** a contributor's local run produces violations
**When** they read the documentation
**Then** the violation table format is explained (file, function, metric, value, threshold)
**And** guidance on how to remediate common violations is present

**Given** a CI run passes on a pull request
**When** a contributor reads the documentation
**Then** the format of the passing Job Summary (metric values) is explained
**And** contributors understand what a passing result means in terms of policy compliance

**Given** the documentation section exists
**When** it is reviewed
**Then** it references `make lint-metrics` as the local command (not the raw CLI invocation)
**And** IDE/editor integration is explicitly noted as out of scope
