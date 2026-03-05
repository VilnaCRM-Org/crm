---
stepsCompleted: [step-01-validate-prerequisites, step-02-design-epics, step-03-create-stories]
inputDocuments:
  - specs/planning-artifacts/2026-03-04-developer-tooling-prd.md
  - specs/planning-artifacts/2026-03-04-developer-tooling-architecture.md
---

# crm - Epic Breakdown

## Overview

This document provides the complete epic and story breakdown for crm (Issue #49 — Developer Tooling Improvements), decomposing the requirements from the PRD and Architecture into implementable stories.

## Requirements Inventory

### Functional Requirements

FR1: Developer can start all required development services (frontend dev server + Mockoon) with a single `make start` command
FR2: `make start` waits until the frontend dev server is accepting connections on its port before exiting
FR3: `make start` waits until Mockoon responds with a successful HTTP response on `http://localhost:8080/api/health` before exiting
FR4: `make start` exits with a non-zero code if either service fails to reach healthy state within the default startup timeout window
FR5: Developer can run all CI checks with a single `make ci` command
FR6: `make ci` runs preflight checks (format check gate) sequentially before parallel execution begins
FR7: `make ci` executes lint, unit tests, and TypeScript checks in parallel (Wave 1)
FR8: `make ci` starts the production build and waits for it to be healthy before proceeding
FR9: `make ci` executes E2E, visual regression, and performance/Lighthouse checks in parallel (Wave 2) only after Wave 1 and the production build succeed
FR10: `make ci` skips Wave 2 and exits immediately if Wave 1 or the production build phase fails
FR11: `make ci` exits with a non-zero code if any check fails
FR12: `make ci` output clearly identifies which specific target failed
FR13: Developer can configure the number of parallel jobs via a `JOBS` variable (default: 2 locally)
FR14: The performance test sequence installs Chromium at most once per run
FR15: `ensure-chromium` is a no-op if Chromium is already present
FR16: Running the full Lighthouse sequence (`build-dev-chromium` → `start` → `lighthouse-desktop` → `lighthouse-mobile`) twice does not trigger a second Chromium installation
FR17: `make lighthouse-desktop` and `make lighthouse-mobile` pass after the Chromium deduplication change
FR18: Developer can see that `make start` starts both `dev` and `mockoon` services via `make help`
FR19: Developer can see which CI checks `make ci` runs via `make help`
FR20: Developer can discover all new Makefile targets via `make help`

### NonFunctional Requirements

NFR1: `make start` completes (both services healthy) within 60 seconds on a standard developer machine under normal conditions
NFR2: `make ci` total wall-clock time is less than running all checks sequentially — parallelism must provide a measurable benefit
NFR3: `make start` produces the same result on repeated invocations — starting already-running services must not cause errors
NFR4: `make ci` infrastructure (parallelism, output sync, phase sequencing) must not introduce flakiness beyond what the underlying test targets themselves exhibit
NFR5: All new Makefile targets follow the existing `## comment` convention so they appear correctly in `make help` output
NFR6: All new targets follow the emoji output style established in `user-service` (`🚀`, `✅`, `❌`) for visual consistency across the VilnaCRM Makefile ecosystem

### Additional Requirements

- **Brownfield scope**: exactly 2 files modified (`Makefile`, `docker-compose.yml`) — no new files or directories
- **FR14–FR17 pre-satisfied**: existing `ensure-chromium` already idempotent — verify and close only, do not rewrite
- **Mockoon service**: port from `docker-compose.test.yml` to `docker-compose.yml` without `healthcheck` block (readiness handled by `wait-for-mockoon` in Makefile)
- **`WAIT_FOR_HTTP` macro**: shared `define` macro must be implemented before any `wait-for-*` targets
- **`wait-for-dev` refactor in place**: do not delete and recreate — refactor to use `WAIT_FOR_HTTP` macro
- **Concurrent polling**: `wait-for-dev` and `wait-for-mockoon` run concurrently via PID-capture pattern in `make start`
- **`PRETTIER_CHECK_CMD`**: CI format gate uses `prettier --check` (not `make format` which uses `--write`)
- **Pinned wave lists**: ci-preflight (`PRETTIER_CHECK_CMD`), ci-wave-1 (`lint-eslint lint-tsc lint-md test-unit-all`), ci-wave-2 (`test-e2e test-visual test-memory-leak lighthouse-desktop lighthouse-mobile`)
- **Breaking change audit**: grep `.github/`, `Makefile`, `*.sh`, `*.md` for `make start` invocations — required PR deliverable
- **Mockoon health endpoint**: use `http://localhost:8080/api/health` for readiness checks (`wait-for-mockoon`); do not poll `/api/users`
- **C1 constraint**: no breaking changes to existing Makefile targets except intentional `make start` blocking behavior change

### FR Coverage Map

FR1:  Epic 1 — single make start command
FR2:  Epic 1 — wait for dev server
FR3:  Epic 1 — wait for Mockoon health
FR4:  Epic 1 — timeout exit
FR5:  Epic 2 — single make ci command
FR6:  Epic 2 — ci-preflight format gate
FR7:  Epic 2 — ci-wave-1 parallel
FR8:  Epic 2 — ci-build-prod gate
FR9:  Epic 2 — ci-wave-2 parallel
FR10: Epic 2 — skip Wave 2 on failure
FR11: Epic 2 — non-zero exit on failure
FR12: Epic 2 — attributable failure output
FR13: Epic 2 — JOBS variable
FR14: Epic 3 — Chromium installs once per run
FR15: Epic 3 — ensure-chromium no-op if present
FR16: Epic 3 — no reinstall on second run
FR17: Epic 3 — lighthouse targets pass
FR18: Epic 1 — make help for start
FR19: Epic 2 — make help for ci
FR20: Epic 2 — make help for all new targets

## Epic List

### Epic 1: Single-Command Development Environment

Developers and new contributors can start a fully working local environment
(frontend dev server + Mockoon backend mock) with a single `make start` command,
with no additional commands required before beginning development work.

**FRs covered:** FR1, FR2, FR3, FR4, FR18
**Additional:** Breaking change audit (grep callers of `make start`) — required
PR deliverable, not captured in FRs but architecturally mandated

### Epic 2: Single-Command CI Suite

Developers can run the complete CI check suite with a single `make ci` command,
with parallel execution and clear failure attribution —
matching the `user-service` CI conventions.

**FRs covered:** FR5, FR6, FR7, FR8, FR9, FR10, FR11, FR12, FR13, FR19, FR20

### Epic 3: Performance Tests Install Chromium Once Per Run

The performance test toolchain installs Chromium exactly once — running the
full Lighthouse sequence twice never triggers a second install, and all
performance targets pass.

**FRs covered:** FR14, FR15, FR16, FR17

<!-- Epics and Stories -->

## Epic 1: Single-Command Development Environment

Developers and new contributors can start a fully working local environment (frontend dev server + Mockoon backend mock) with a single `make start` command, with no additional commands required before beginning development work.

### Story 1.1: Add Mockoon Service to Development Docker Compose

As a **developer**,
I want Mockoon to be defined in `docker-compose.yml`,
So that `make start` can orchestrate it alongside the dev container.

**Acceptance Criteria:**

**Given** `docker-compose.yml` exists with only the `dev` service
**When** the Mockoon service definition is ported from `docker-compose.test.yml`
**Then** `docker-compose.yml` contains a `mockoon` service with correct port and network config
**And** the `healthcheck` block is NOT included (readiness handled by Makefile polling)
**And** `docker compose up -d mockoon` starts the Mockoon container successfully
**And** all existing targets that reference `docker-compose.yml` continue to work unchanged

---

### Story 1.2: Shared Health-Check Polling Macro

As a **developer**,
I want a shared `WAIT_FOR_HTTP` Make macro,
So that `wait-for-dev` and `wait-for-mockoon` use identical, maintainable polling logic.

**Acceptance Criteria:**

**Given** the existing `wait-for-dev` target uses an inline polling loop
**When** the `WAIT_FOR_HTTP` `define` macro is implemented
**Then** the macro accepts 4 parameters: service name, URL, max tries, sleep interval
**And** `wait-for-dev` is refactored in place to use `$(call WAIT_FOR_HTTP,...)` (not deleted and recreated)
**And** `wait-for-dev` behaviour is identical before and after the refactor
**And** `WAIT_FOR_MOCKOON_MAX_TRIES ?= 30` and `WAIT_FOR_MOCKOON_SLEEP ?= 2` variables are defined
**And** a new `wait-for-mockoon` target polls Mockoon's health endpoint using the same macro

---

### Story 1.3: `make start` Orchestrates Complete Development Environment

As a **developer**,
I want `make start` to bring up both the dev server and Mockoon with health-based readiness,
So that I have a fully working local environment after one command with no additional steps.

**Acceptance Criteria:**

**Given** Story 1.1 and 1.2 are complete
**When** a developer runs `make start`
**Then** both `dev` and `mockoon` containers start via `docker compose up -d --build dev mockoon`
**And** before polling begins, the implementer verifies `http://localhost:8080/api/health` is reachable in the Mockoon runtime and wires `wait-for-mockoon` to that endpoint (not `/api/users`)
**And** `wait-for-dev` and `wait-for-mockoon` run concurrently using PID-capture pattern
**And** readiness polling starts only against that verified Mockoon health endpoint
**And** `make start` exits 0 only after both services pass their health checks
**And** `make start` exits non-zero if either service fails to become healthy within 60 seconds
**And** `make start` is idempotent — running it when services are already up produces no errors
**And** Mockoon responds to API calls immediately after `make start` completes

---

### Story 1.4: Breaking Change Audit — `make start` Callers

As a **team member**,
I want all callers of `make start` in CI YAML, scripts, and docs to be verified for the new blocking behaviour,
So that no existing workflow breaks when `make start` changes from non-blocking to blocking.

**Acceptance Criteria:**

**Given** `make start` now blocks until services are healthy
**When** a grep audit runs across `.github/`, `Makefile`, `*.sh`, and `*.md` for `make start` invocations
**Then** every found invocation is reviewed and either confirmed safe (tolerates blocking) or updated
**And** the PR description documents all callers found and their disposition
**And** zero unreviewed callers remain at merge time

---

### Story 1.5: Document `make start` in `make help`

As a **developer**,
I want `make start` to show in `make help` that it starts both `dev` and `mockoon`,
So that I can discover what the command does without reading the Makefile source.

**Acceptance Criteria:**

**Given** `make start` now orchestrates two services
**When** a developer runs `make help`
**Then** the `start` target entry mentions both `dev` and `mockoon` services
**And** the comment follows the existing `## descriptive comment` format
**And** `make help` output is otherwise unchanged

## Epic 2: Single-Command CI Suite

Developers can run the complete CI check suite with a single `make ci` command, with parallel execution and clear failure attribution — matching the `user-service` CI conventions.

### Story 2.1: CI Format Check Gate (`ci-preflight`)

As a **developer**,
I want `make ci` to fail fast on unformatted code before running any tests,
So that formatting issues are caught immediately without wasting time on slower checks.

**Acceptance Criteria:**

**Given** `PRETTIER_CHECK_CMD` is defined using `prettier --check` (not `--write`)
**When** a developer runs `make ci-preflight`
**Then** it runs `prettier --check` via a one-off command invocation (`docker compose run --rm dev $(PRETTIER_CHECK_CMD)` or equivalent), not `docker compose exec`
**And** the check runs from a clean container state and returns non-zero on formatting failures
**And** it exits non-zero if any file is not formatted, with output identifying the issue
**And** it exits 0 if all files are correctly formatted
**And** `make format` (write mode) is unchanged — C1 constraint satisfied
**And** `make ci` calls `ci-preflight` as its first sequential phase

---

### Story 2.2: `make ci` Wave 1 — Parallel Lint and Unit Tests

As a **developer**,
I want lint, TypeScript checks, and unit tests to run in parallel,
So that Wave 1 of `make ci` completes faster than sequential execution.

**Acceptance Criteria:**

**Given** `ci-preflight` passes
**When** `make ci-wave-1` runs
**Then** `lint-eslint`, `lint-tsc`, `lint-md`, and `test-unit-all` run in parallel via `make -j$(JOBS) --output-sync=target`
**And** `JOBS ?= 2` is defined as the default parallelism level
**And** output per target is buffered and printed atomically — no interleaved output
**And** `ci-wave-1` exits non-zero if any target fails, with the failing target clearly identified
**And** `make ci` halts and does not proceed to `ci-build-prod` if `ci-wave-1` fails

---

### Story 2.3: `make ci` Production Build Gate (`ci-build-prod`)

As a **developer**,
I want `make ci` to build the production bundle and wait for it to be healthy before running E2E tests,
So that Wave 2 tests always run against a verified production build.

**Acceptance Criteria:**

**Given** `ci-wave-1` passes
**When** `make ci-build-prod` runs
**Then** it calls `make start-prod` and polls port 3001 until healthy
**And** it exits non-zero if the production build fails to start within the configured timeout
**And** `make ci` halts and does not proceed to `ci-wave-2` if `ci-build-prod` fails
**And** `make start-prod` is unchanged — C1 constraint satisfied

---

### Story 2.4: `make ci` Wave 2 — Parallel E2E, Visual, and Performance Tests

As a **developer**,
I want E2E, visual regression, and performance tests to run in parallel after the production build,
So that Wave 2 of `make ci` completes faster than sequential execution.

**Acceptance Criteria:**

**Given** `ci-build-prod` passes
**When** `make ci-wave-2` runs
**Then** `test-e2e`, `test-visual`, `test-memory-leak`, `lighthouse-desktop`, and `lighthouse-mobile` run in parallel via `make -j$(JOBS) --output-sync=target`
**And** output per target is buffered and printed atomically
**And** `ci-wave-2` exits non-zero if any target fails, with the failing target clearly identified
**And** `make ci` exits non-zero if `ci-wave-2` fails

---

### Story 2.5: Document `make ci` and CI Phase Targets in `make help`

As a **developer**,
I want `make ci` and all CI phase targets to appear in `make help` with clear descriptions,
So that I can discover all CI commands without reading the Makefile source.

**Acceptance Criteria:**

**Given** `make ci` and all CI phase targets are implemented
**When** a developer runs `make help`
**Then** `ci` entry describes running all CI checks in two parallel waves
**And** all CI phase targets (`ci-preflight`, `ci-wave-1`, `ci-build-prod`, `ci-wave-2`) appear with descriptions
**And** all entries follow the existing `## descriptive comment` format
**And** `make help` output is otherwise unchanged

## Epic 3: Performance Tests Install Chromium Once Per Run

The performance test toolchain installs Chromium exactly once — running the full Lighthouse sequence twice never triggers a second install, and all performance targets pass.

### Story 3.1: Verify `ensure-chromium` Idempotency

As a **developer running performance tests**,
I want `ensure-chromium` to be a no-op when Chromium is already installed,
So that the Lighthouse sequence never installs Chromium twice and performance tests pass cleanly.

**Acceptance Criteria:**

**Given** the existing `ensure-chromium` target contains a `[ -x "$(CHROMIUM_BIN_PATH)" ]` guard
**When** the implementation is audited against FR14–FR17
**Then** `ensure-chromium` exits 0 immediately if Chromium is already present (no reinstall)
**And** running `make lighthouse-desktop && make lighthouse-mobile` twice in sequence triggers exactly one Chromium install
**And** `make lighthouse-desktop` and `make lighthouse-mobile` pass without errors
**And** if the existing implementation already satisfies all four FRs (FR14–FR17), no code changes are made
**And** the story is closed with a comment confirming the verification result
