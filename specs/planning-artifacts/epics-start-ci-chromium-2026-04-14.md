---
stepsCompleted:
  [
    'step-01-validate-prerequisites',
    'step-02-design-epics',
    'step-03-create-stories',
    'step-04-final-validation',
  ]
inputDocuments:
  - 'specs/planning-artifacts/prd-start-ci-chromium-2026-04-10.md'
  - 'specs/planning-artifacts/architecture-ci-chromium-2026-04-14.md'
---

# crm - Epic Breakdown

## Overview

This document provides the complete epic and story breakdown for crm, decomposing the requirements
from the PRD, UX Design if it exists, and Architecture requirements into implementable stories.

## Requirements Inventory

### Functional Requirements

- FR1: Developer can start a complete development environment with a single `make start` command.
- FR2: `make start` can bring up the frontend dev server and Mockoon API mock server simultaneously.
- FR3: `make start` can verify health/readiness of both dev and Mockoon services before returning
  control to the developer.
- FR4: `make start` can report clear status output indicating which services are healthy and ready.
- FR5: `make start` can fail with non-zero exit and clear error output if any service fails its
  health check.
- FR6: Developer can access the frontend application on port 3000 with functioning API mock
  responses on port 8080 after `make start` completes.
- FR7: Developer can run all CI checks locally with a single `make ci` command.
- FR8: `make ci` can produce consistent, correct results regardless of whether the development
  environment is already running or not.
- FR9: `make ci` can reuse an already-running development environment without restarting services.
- FR10: `make ci` can exit with non-zero status if any check fails.
- FR11: Developer can identify which specific check failed and its output from `make ci` results.
- FR12: Developer can run MVP CI phases via composable sub-targets `ci-setup`, `ci-lint`, and
  `ci-test`.
- FR13: GitHub Actions CI workflow can delegate all check execution to `make ci` without maintaining
  a separate check list.
- FR14: `make ci` can produce identical results whether run locally or in GitHub Actions.
- FR15: Lighthouse flow can verify Chromium presence at most once per execution, regardless of how
  many audit targets follow.
- FR16: `make lighthouse-desktop` and `make lighthouse-mobile` can run sequentially without
  redundant Chromium setup.
- FR17: Chromium detection can work identically whether Chromium was baked into the Docker image or
  installed at runtime.
- FR18: Developer can find documentation for `make start` behavior, including both services and
  health checks, in README.
- FR19: Developer can find documentation for `make ci` usage and its relationship to GitHub Actions
  in README.
- FR20: Developer can discover new/changed targets via `make help` output.

### NonFunctional Requirements

NFR1: `make start` completes with both services healthy in under 5 minutes on a warm Docker cache.
NFR2: `make ci` total wall-clock time is bounded by the slowest parallel phase, not the sum of all
checks. NFR3: No Chromium package installation step executes when Chromium is already present in the
container; only the presence check runs. NFR4: `make ci` produces deterministic results; running it
twice on the same code yields the same pass/fail outcome. NFR5: `make start` completes successfully
regardless of whether services are already running, stopped, or not yet created. NFR6: `make ci`
completes successfully regardless of whether the development environment is already running,
stopped, or not yet created. NFR7: Parallel check execution does not introduce flaky failures due to
resource contention or race conditions. NFR8: When a check fails during `make ci`, all checks within
the same phase complete before `make ci` reports failure, so developers see all failures in a single
run. NFR9: If `make ci` environment setup fails, no subsequent check phases execute. NFR10:
Developer can determine which checks passed and which failed from `make ci` summary output without
reading individual check logs. NFR11: `make ci` requires only GNU Make 4.0+, available on Alpine
3.x, Ubuntu 20.04+, and macOS with Homebrew make. NFR12: All new/changed targets work in both local
Docker Compose and DIND (Docker-in-Docker) CI environments. NFR13: No new host-level dependencies
introduced; only Docker, Make, and existing project tooling are required.

### Additional Requirements

- No starter template applies; this is brownfield infrastructure work against the existing Makefile,
  Docker Compose, and GitHub Actions setup.
- Adopt the user-service `make ci` reference pattern: phased structure with
  `$(MAKE) -j --output-sync=target`.
- Preserve the "Make targets as contracts" principle: a target does exactly what its name says,
  completely and reliably.
- Split environment-owning targets from environment-assuming CI sub-targets. Existing
  developer-facing test targets keep owning environment lifecycle, while `ci-*` sub-targets assume
  the environment is already running.
- Move the Mockoon service definition to `docker-compose.yml` and remove it from
  `docker-compose.test.yml`.
- Update `start` to bring up `dev mockoon`, then run `wait-for-dev` and `wait-for-mockoon`.
- Update `start-prod` to compose with `docker-compose.yml`, `docker-compose.test.yml`, and
  `common-healthchecks.yml`, starting explicit services `prod mockoon playwright`, then run
  `wait-for-prod-health`.
- Keep the Mockoon service name stable as `mockoon`; preserve `patch-prod-mockoon-url` references.
- Add `MOCKOON_PORT ?= 8080` near existing port variables and use `$(MOCKOON_PORT)` Make expansion,
  not shell default syntax.
- Add `wait-for-mockoon` using a TCP probe via `wait-on` with `--timeout 60000`, matching the
  existing wait pattern.
- Implement `make ci` as sequential phases: `ci-setup`, `ci-lint`, then `ci-test`. Do not
  parallelize the top-level `ci` target.
- Add `ci-setup: create-network`, with `CI=1` using `up -d --build dev mockoon` and local runs using
  `up -d --no-recreate dev mockoon`, followed by `wait-for-dev` and `wait-for-mockoon`.
- Add `ci-lint` to run `lint-eslint`, `lint-tsc`, and `lint-md` in parallel with
  `$(MAKE) -j --output-sync=target`.
- Add `ci-test` to run `ci-test-unit-client` and `ci-test-unit-server` in parallel with
  `$(MAKE) -j --output-sync=target`.
- Add environment-assuming `ci-test-unit-client` and `ci-test-unit-server` targets that execute
  tests through `$(EXEC_DEV_TTYLESS)` without re-calling `make start`.
- Preserve the top-level Makefile `export` directive; it is load-bearing for the `CI=1` conditional.
- Replace the GitHub Actions static and unit check list with a new minimal CI workflow that calls
  `make ci` with `CI: 1`.
- Update GitHub branch protection and audit external job-name references before retiring
  `static-testing.yml` and `unit-testing.yml`.
- Extract `ensure-chromium` and `start-prod` into a shared `lighthouse-setup` prerequisite target.
- Update `lighthouse-desktop` and `lighthouse-mobile` to depend on `lighthouse-setup` and call
  `$(LHCI)` directly with their respective config and Chrome args.
- Remove `LHCI_BUILD_CMD` after all references are replaced.
- Document GNU Make 4.0+ as a hard prerequisite in README and CONTRIBUTING.md; no `ci-sequential`
  fallback is required for MVP.
- Document `make start`, `make ci`, and the "Make targets as contracts" principle.
- Verify blast-radius targets after changes, especially unit, e2e, visual, memory-leak, load, and
  Lighthouse targets that depend on `start` or `start-prod`.

### UX Design Requirements

No UX Design document was found for the selected start-ci-chromium scope.

### FR Coverage Map

- FR1: Epic 1 - Complete Local Development Startup
- FR2: Epic 1 - Complete Local Development Startup
- FR3: Epic 1 - Complete Local Development Startup
- FR4: Epic 1 - Complete Local Development Startup
- FR5: Epic 1 - Complete Local Development Startup
- FR6: Epic 1 - Complete Local Development Startup
- FR7: Epic 2 - Local CI Parity Command
- FR8: Epic 2 - Local CI Parity Command
- FR9: Epic 2 - Local CI Parity Command
- FR10: Epic 2 - Local CI Parity Command
- FR11: Epic 2 - Local CI Parity Command
- FR12: Epic 2 - Local CI Parity Command
- FR13: Epic 3 - GitHub Actions CI Single Source of Truth
- FR14: Epic 2 - Local CI Parity Command
- FR15: Epic 4 - Efficient Lighthouse Chromium Setup
- FR16: Epic 4 - Efficient Lighthouse Chromium Setup
- FR17: Epic 4 - Efficient Lighthouse Chromium Setup
- FR18: Epic 5 - Developer Workflow Documentation and Discoverability
- FR19: Epic 5 - Developer Workflow Documentation and Discoverability
- FR20: Epic 5 - Developer Workflow Documentation and Discoverability

## Epic List

### Epic 1: Complete Local Development Startup

Developers can run `make start` and get a working frontend plus Mockoon API mock, with readiness
checks and clear failure output. **FRs covered:** FR1, FR2, FR3, FR4, FR5, FR6

### Epic 2: Local CI Parity Command

Developers can run `make ci` locally and get the same deterministic lint/unit-test pass/fail signal
that GitHub Actions uses, with safe phased parallelism and composable sub-targets. **FRs covered:**
FR7, FR8, FR9, FR10, FR11, FR12, FR14

### Epic 3: GitHub Actions CI Single Source of Truth

The CI workflow delegates check execution to `make ci`, removing duplicated check lists while
preserving branch protection expectations during workflow retirement. **FRs covered:** FR13

### Epic 4: Efficient Lighthouse Chromium Setup

Developers can run desktop and mobile Lighthouse audits without redundant Chromium setup, using one
shared setup path. **FRs covered:** FR15, FR16, FR17

### Epic 5: Developer Workflow Documentation and Discoverability

Developers can understand the new `make start`, `make ci`, GNU Make prerequisite, and changed
targets through README, CONTRIBUTING, and `make help`. **FRs covered:** FR18, FR19, FR20

## Epic 1 Stories: Complete Local Development Startup

Developers can run `make start` and get a working frontend plus Mockoon API mock, with readiness
checks and clear failure output.

### Story 1.1: Move Mockoon Into the Development Compose Topology

As a developer, I want Mockoon to be part of the development compose stack, So that local startup
and test startup can share the same stable Mockoon service.

**Acceptance Criteria:**

**Given** Mockoon is currently defined in `docker-compose.test.yml` **When** the compose topology is
updated **Then** Mockoon is defined in `docker-compose.yml` **And** `docker-compose.test.yml` no
longer owns the Mockoon service **And** the service name remains `mockoon` **And** existing
`patch-prod-mockoon-url` references remain valid.

### Story 1.2: Start Frontend and Mockoon Together

As a developer, I want `make start` to start both the frontend dev server and Mockoon, So that the
local app works with mock API responses after one command.

**Acceptance Criteria:**

**Given** the developer runs `make start` **When** Docker Compose starts the development stack
**Then** both `dev` and `mockoon` services are started **And** the command waits for frontend
readiness **And** the command waits for Mockoon readiness **And** the frontend is reachable on port
3000 **And** Mockoon is reachable on port 8080.

### Story 1.3: Add Mockoon Readiness and Failure Output

As a developer, I want clear readiness and failure output for Mockoon startup, So that I know
whether the local API mock is ready or why startup failed.

**Acceptance Criteria:**

**Given** `MOCKOON_PORT ?= 8080` is defined near existing port variables **When** `wait-for-mockoon`
runs **Then** it probes `tcp:$(WEBSITE_DOMAIN):$(MOCKOON_PORT)` with a 60000ms timeout **And** it
prints a waiting message before probing **And** it prints a success message when Mockoon is ready
**And** it exits non-zero with a clear failure message when Mockoon is not ready.

### Story 1.4: Preserve Production Test Startup After the Mockoon Move

As a developer running test and production-like workflows, I want `start-prod` to keep starting
everything its dependent targets need, So that e2e, visual, load, memory, and Lighthouse workflows
do not regress.

**Acceptance Criteria:**

**Given** Mockoon has moved to `docker-compose.yml` **When** `make start-prod` runs **Then** it
composes `docker-compose.yml`, `docker-compose.test.yml`, and `common-healthchecks.yml` **And** it
starts explicit services `prod mockoon playwright` **And** it uses `--no-recreate` for idempotency
**And** it still runs `wait-for-prod-health` **And** `start-prod` dependent targets retain access to
`prod`, `mockoon`, and `playwright` **And** `start-prod` always uses `--no-recreate`; CI freshness
is handled by `ci-setup` with `CI=1` and `--build`, while production-like test targets prioritize
idempotent reuse of the already-running `prod`, `mockoon`, and `playwright` services.

## Epic 2 Stories: Local CI Parity Command

Developers can run `make ci` locally and get the same deterministic lint/unit-test pass/fail signal
that GitHub Actions uses, with safe phased parallelism and composable sub-targets.

### Story 2.1: Add CI Environment Setup Phase

As a developer, I want `make ci` to prepare the required local environment once, So that all CI
checks run against a ready and consistent dev stack.

**Acceptance Criteria:**

**Given** `make ci` needs the dev environment before checks run **When** `ci-setup` executes
**Then** it depends on `create-network` **And** it starts `dev mockoon` **And** it uses
`up -d --build dev mockoon` when `CI=1` **And** it uses `up -d --no-recreate dev mockoon` for local
runs **And** it runs `wait-for-dev` **And** it runs `wait-for-mockoon`.

### Story 2.2: Add Parallel Lint Phase

As a developer, I want lint checks to run in a single composable CI phase, So that local CI feedback
is faster without hiding individual failures.

**Acceptance Criteria:**

**Given** the environment setup phase has completed **When** `ci-lint` runs **Then** it executes
`lint-eslint`, `lint-tsc`, and `lint-md` **And** it runs them with `$(MAKE) -j --output-sync=target`
**And** output remains grouped per target **And** a failed lint target causes `ci-lint` to fail.

### Story 2.3: Add Environment-Assuming Unit Test Phase

As a developer, I want unit tests to run in parallel without re-running `make start`, So that
`make ci` avoids Docker startup races and still verifies client and server tests.

**Acceptance Criteria:**

**Given** `ci-setup` has already started the environment **When** `ci-test` runs **Then** it
executes `ci-test-unit-client` and `ci-test-unit-server` **And** it runs them with
`$(MAKE) -j --output-sync=target` **And** neither sub-target calls `make start` **And**
`ci-test-unit-client` runs client unit tests through `$(EXEC_DEV_TTYLESS)` **And**
`ci-test-unit-server` runs server unit tests through `$(EXEC_DEV_TTYLESS)`.

### Story 2.4: Add Top-Level make ci Orchestration

As a developer, I want one `make ci` command that runs setup, lint, and tests in the correct order,
So that I get a definitive local CI result before pushing.

**Acceptance Criteria:**

**Given** `ci-setup`, `ci-lint`, and `ci-test` exist **When** the developer runs `make ci` **Then**
the phases run sequentially as setup, lint, test **And** the top-level `ci` target is not
parallelized **And** if setup fails, lint and test phases do not run **And** if any lint or test
target fails, `make ci` exits non-zero **And** `ci-lint` and `ci-test` remain directly runnable
composable sub-targets **And** the top-level Makefile `export` directive remains intact **And**
after `make ci` completes, whether successful or failed, the top-level target prints a concise
NFR10 / Story 2.4 summary showing pass/fail status for each sub-target: `ci-setup`, `ci-lint`, and
`ci-test`.

## Epic 3 Stories: GitHub Actions CI Single Source of Truth

The CI workflow delegates check execution to `make ci`, removing duplicated check lists while
preserving branch protection expectations during workflow retirement.

### Story 3.1: Add GitHub Actions Workflow That Calls make ci

As a developer, I want GitHub Actions to run `make ci`, So that local and remote CI use the same
check definition.

**Acceptance Criteria:**

**Given** the repository has separate CI check definitions today **When** the new CI workflow runs
on pull requests **Then** the workflow calls `make ci` **And** it passes `CI=1` **And** it does not
duplicate the lint or unit test target list in workflow YAML **And** a non-zero `make ci` result
fails the workflow.

### Story 3.2: Retire Redundant Static and Unit Workflows Safely

As a maintainer, I want obsolete workflow definitions retired only after required-check dependencies
are handled, So that CI consolidation does not break merges or silently remove protection.

**Acceptance Criteria:**

**Given** `make ci` covers the static and unit checks **When** retiring `static-testing.yml` and
`unit-testing.yml` **Then** branch protection required checks are updated from old job names to the
new CI job name before retirement **And** external job-name references are audited for `static` and
`unit` **And** any references in status checks, coverage integrations, or automation are updated or
explicitly documented as not applicable **And** the retirement happens only after the new `make ci`
workflow is available **And** the maintainer owning branch protection runs the new CI workflow, or
inspects the compiled GitHub Actions job names, and records that the emitted job name exactly
matches the updated branch protection required-check string (`ci`) before `static-testing.yml` and
`unit-testing.yml` are retired.

## Epic 4 Stories: Efficient Lighthouse Chromium Setup

Developers can run desktop and mobile Lighthouse audits without redundant Chromium setup, using one
shared setup path.

### Story 4.1: Introduce Shared Lighthouse Setup Target

As a developer running Lighthouse audits, I want Lighthouse environment setup to happen through one
shared prerequisite, So that Chromium verification and production startup are not duplicated across
audit targets.

**Acceptance Criteria:**

**Given** Lighthouse targets currently rely on duplicated setup through `LHCI_BUILD_CMD` **When**
`lighthouse-setup` is added **Then** it depends on `ensure-chromium` and `start-prod` **And** it
prints a clear ready message after setup **And** Make dependency resolution guarantees the setup
target runs at most once per Make invocation **And** it reuses the corrected `start-prod` behavior
from Epic 1.

### Story 4.2: Update Desktop and Mobile Lighthouse Targets to Use Shared Setup

As a developer running desktop and mobile Lighthouse audits, I want both audit targets to use the
shared setup path, So that sequential audit runs do not repeat Chromium setup unnecessarily.

**Acceptance Criteria:**

**Given** `lighthouse-setup` exists **When** `make lighthouse-desktop` runs **Then** it depends on
`lighthouse-setup` **And** it invokes `$(LHCI)` directly with the desktop config and Chrome
arguments **And** it does not call `ensure-chromium` through `LHCI_BUILD_CMD`.

**Given** `lighthouse-setup` exists **When** `make lighthouse-mobile` runs **Then** it depends on
`lighthouse-setup` **And** it invokes `$(LHCI)` directly with the mobile config and Chrome arguments
**And** it does not call `ensure-chromium` through `LHCI_BUILD_CMD`.

### Story 4.3: Remove Obsolete Lighthouse Build Command Wiring

As a maintainer, I want obsolete Lighthouse setup wiring removed, So that future Lighthouse targets
cannot accidentally reintroduce duplicate Chromium checks.

**Acceptance Criteria:**

**Given** desktop and mobile Lighthouse targets use `lighthouse-setup` **When** the old wiring is
removed **Then** `LHCI_BUILD_CMD` no longer exists **And** no Makefile target references
`LHCI_BUILD_CMD` **And** a verification command or Make dry-run demonstrates `ensure-chromium` is
reached through `lighthouse-setup`, not through per-target build commands.

## Epic 5 Stories: Developer Workflow Documentation and Discoverability

Developers can understand the new `make start`, `make ci`, GNU Make prerequisite, and changed
targets through README, CONTRIBUTING, and `make help`.

### Story 5.1: Document Complete Local Startup Behavior

As a developer, I want README documentation for the updated `make start` behavior, So that I know
the command starts both the frontend and Mockoon API mock and what ports to use.

**Acceptance Criteria:**

**Given** `make start` starts both `dev` and `mockoon` **When** README startup documentation is
updated **Then** it states that the frontend runs on port 3000 **And** it states that Mockoon runs
on port 8080 **And** it describes that both services are health/readiness checked **And** it
explains the expected failure behavior at a user-facing level.

### Story 5.2: Document make ci Usage and GNU Make Prerequisite

As a developer, I want README and CONTRIBUTING guidance for `make ci`, So that I can run the same
check command locally that GitHub Actions runs.

**Acceptance Criteria:**

**Given** `make ci` is the canonical local/remote CI command **When** README and CONTRIBUTING are
updated **Then** they document `make ci` as the pre-push validation command **And** they document
that GitHub Actions delegates to `make ci` **And** they list the check phases at a user-facing level
**And** they document GNU Make 4.0+ as a requirement **And** they include macOS Homebrew make
guidance.

### Story 5.3: Make Changed Targets Discoverable Through make help

As a developer, I want changed public Makefile targets to appear in `make help`, So that I can
discover available workflow commands from the terminal.

**Acceptance Criteria:**

**Given** new or changed public targets exist **When** `make help` runs **Then** `start` describes
frontend plus Mockoon startup **And** `ci`, `ci-lint`, and `ci-test` have `##` descriptions **And**
`wait-for-mockoon` has a `##` description **And** `lighthouse-desktop` and `lighthouse-mobile`
descriptions remain accurate **And** internal implementation-only targets are not over-documented as
public workflows.

### Story 5.4: Document Make Targets as Contracts

As a maintainer, I want the Make target contract principle documented, So that future Makefile
changes preserve predictable developer workflows.

**Acceptance Criteria:**

**Given** this initiative establishes "Make targets as contracts" **When** CONTRIBUTING is updated
**Then** it states that a Make target must do what its name promises completely and reliably **And**
it calls out environment-owning versus environment-assuming target conventions **And** it tells
contributors to keep public target help text current **And** it tells contributors to include
readiness checks for environment-owning startup targets.
