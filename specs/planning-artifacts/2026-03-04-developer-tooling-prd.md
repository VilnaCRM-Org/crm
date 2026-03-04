---
stepsCompleted: [step-01-init, step-02-discovery, step-03-success, step-04-journeys, step-05-domain, step-06-innovation, step-07-project-type, step-08-scoping, step-09-functional, step-10-nonfunctional, step-11-polish, step-12-complete]
inputDocuments: []
workflowType: 'prd'
briefCount: 0
researchCount: 0
brainstormingCount: 0
projectDocsCount: 0
classification:
  projectType: web_app
  domain: general
  complexity: low-medium
  projectContext: brownfield
---

# Product Requirements Document — Developer Tooling Improvements

**Project:** crm
**Author:** Dima
**Date:** 2026-03-04
**Issue:** [#49 — Improve start/ci targets and fix duplicate Chromium install](https://github.com/VilnaCRM-Org/crm/issues/49)

## Overview

The CRM frontend project's developer tooling has three friction points that slow down every developer, every day:

1. **`make start` is incomplete** — it starts the frontend dev container but not Mockoon. Developers must run a second command or API calls silently fail.
2. **No single CI command exists** — running the full check suite requires executing each `make test-*` target manually in sequence.
3. **Chromium installs twice** in the Lighthouse/performance flow — once during image build, again at runtime — wasting time and creating confusion about which install is authoritative.

This PRD defines requirements for a single PR that resolves all three issues, following the conventions established in `user-service`.

## Success Criteria

### User Success

- A developer runs `make start` once and has a fully working local environment — frontend dev server with hot-reload **and** Mockoon backend mock — with no additional commands required
- API calls work immediately after `make start` completes; readiness means Mockoon responds HTTP 200 on its health endpoint (not just container started)
- New contributors can start developing from a single command without needing to read docs about Mockoon or secondary services

### Business Success

- All CI checks (lint, unit tests, E2E, visual, performance, etc.) can be triggered with a single `make ci` command instead of manually running each target in sequence
- `make ci` works for both local developer use and CI pipeline use via `CI=1` environment variable
- `make ci` fails fast and clearly; failures are attributable to a specific target with no garbled parallel output

### Technical Success

- `make start` orchestrates `dev` + `mockoon` services and exits only when both pass health-based readiness checks
- `make ci` executes checks in two parallel waves with `--output-sync=target`, providing clean per-target output
- Chromium is installed exactly once per Lighthouse run — idempotent, single source of truth
- `lighthouse-desktop` and `lighthouse-mobile` pass after the change
- No regression for any existing Makefile targets

### Measurable Outcomes

- Zero extra commands needed after `make start` to have a working dev environment
- All CI checks run via one command (`make ci`)
- `make ci` failure output clearly identifies which target failed
- Chromium install count: 1 per performance test run (down from 2)

## User Journeys

### Journey 1: Alex — Frontend Developer (Daily Use)

**Before:** Alex pulls the latest changes Monday morning and runs `make start`. The frontend dev container spins up — but Mockoon isn't running. He opens the browser, navigates to the registration flow, and the form submits into silence. He spends 10 minutes wondering if it's his code before discovering Mockoon was never started. He runs a second command, waits again — 15 minutes after sitting down, he's finally working.

**After:** Alex runs `make start`. Both `dev` and `mockoon` start together. The command waits until Mockoon returns HTTP 200, then exits. API calls work immediately. He's writing code within 2 minutes.

---

### Journey 2: Mia — New Contributor (Onboarding)

> ⚠️ *Assumed pain point — not validated from contributor complaints. Included as hypothesis.*

**Before:** Mia joins the team, follows the README, runs `make start`. The frontend loads but the form does nothing. She spends an hour on Slack before discovering the separate Mockoon command. She's frustrated before writing a single line of code — and begins to doubt whether she's doing something wrong.

**After:** Mia runs `make start`. Everything comes up. The experience restores confidence — the project just works. One command, documented correctly, no hidden steps.

---

### Journey 3a: CI Pipeline — Happy Path

**Before:** GitHub Actions sequences multiple separate `make` targets as individual YAML steps. Adding a new check means editing the pipeline. There's no single place to confirm "all checks passed."

**After:** The CI YAML calls `make ci`. All checks run in two parallel waves. When everything passes, the developer sees one green check. Simple, fast, authoritative.

---

### Journey 3b: CI Pipeline — Failure Path (Debugging at Midnight)

**Before:** A developer's PR fails in CI. They open the run — 400 lines of interleaved parallel output. Unit test failures mixed with lint warnings mixed with E2E output. They scroll for 5 minutes, re-run the suite, still can't pinpoint the failure.

**After:** `make ci` fails and clearly surfaces `❌ FAILED: test-unit-client`. The developer goes directly to the relevant output. Mean time to recovery drops from 15 minutes to 2 minutes.

---

### Journey 4: Dana — Developer Running Performance Tests

**Before:** Dana runs the Lighthouse sequence. Chromium installs during `build-dev-chromium`. Then installs again during `start`. Then `ensure-chromium` runs again during `lighthouse-desktop`. Minutes wasted, no clarity on which install is authoritative.

**After:** Chromium installs once during the build step. `ensure-chromium` is a no-op when Chromium is present. Running the sequence twice doesn't trigger reinstall.

---

### Journey Requirements Summary

| Capability | Revealed By | Priority |
|---|---|---|
| Orchestrated `dev` + `mockoon` startup | Journey 1, 2 | MVP |
| Health-based readiness checks (HTTP 200) | Journey 1 | MVP |
| Updated `make start` documentation | Journey 2 | MVP |
| `make ci` with parallel execution | Journey 3a | MVP |
| Configurable CI job list | Journey 3a | MVP |
| Attributable failure output per target | Journey 3b | MVP (highest value) |
| Single Chromium install source of truth | Journey 4 | MVP |
| Idempotent `ensure-chromium` | Journey 4 | MVP |

## Project Scoping

### Delivery Model

**One PR, three logical commits** — `make start`, `make ci`, Chromium deduplication — each independently reviewable but merged together. Splitting deliverables is an emergency fallback only; the default is all three in one PR.

**Resource:** 1 developer, single sprint. No new infrastructure dependencies.

### MVP — This PR

All four user journeys (Alex, Mia, CI pipeline, Dana) are served by these three deliverables together.

- `make start` bringing up `dev` + `mockoon` with health-based readiness checks
- `make ci` with two-wave parallel execution, `--output-sync=target`, `JOBS ?= 2`
- `CI=1` switching across all CI targets
- `ci-sequential` fallback with collected failure summary
- Chromium install deduplication — single idempotent `ensure-chromium`
- Updated `make help` documentation

### Post-MVP

- Configurable readiness check timeout and retry count via Makefile variables

### Risk Mitigation

**Breaking Change:** `make start` changes from non-blocking to blocking. Audit all CI YAML steps, scripts, and docs that call `make start` and assume immediate exit — these will break.

**Technical Risk:** Two-wave CI with prod build dependency is the most complex piece — `ci-sequential` as a tested fallback mitigates this from day one.

**Resource Risk:** If the PR must be split, Chromium deduplication is the most independent and lowest-risk item to defer.

## Technical Architecture

This section captures implementation-relevant decisions to guide the developer, following `user-service` conventions.

### Parallelism & Output

- **Mechanism:** GNU Make `-jN` with `--output-sync=target` — output buffered per target, printed atomically after completion
- **Parallelism level:** `JOBS ?= 2` locally (resource-aware); CI overrides to `JOBS=4`
- **Output style:** Matches `user-service` emoji conventions (`🚀`, `✅`, `❌`)

### CI vs Local Execution

`CI=1` environment variable switches execution context:
- **Without `CI=1` (local):** `docker compose exec -T dev bun x jest`
- **With `CI=1` (CI runner):** `bun x jest` directly — no Docker exec

### `make ci` Phase Structure

E2E, visual, and performance tests require a running production build. `make ci` therefore executes in three ordered phases:

```
Phase 1 — ci-wave-1 (parallel): lint, unit tests, TypeScript check
Phase 2 — ci-build-prod (sequential gate): start-prod, wait for port 3001
Phase 3 — ci-wave-2 (parallel): E2E, visual regression, performance/Lighthouse
```

If Phase 1 or Phase 2 fails, `make ci` exits immediately without starting Phase 3.

```makefile
ci: ci-preflight ci-wave-1 ci-build-prod ci-wave-2  ## Run all CI checks

ci-preflight:   # Sequential: format + style gates
ci-wave-1:      # Parallel -j$(JOBS): lint, unit, tsc
ci-build-prod:  # Sequential: start-prod + wait for port 3001
ci-wave-2:      # Parallel -j$(JOBS): e2e, visual, performance
ci-sequential:  # Fallback: run all sequentially, collect all failures
```

### `make start` Readiness

- Brings up `dev` and `mockoon` via Docker Compose
- Polls Mockoon health endpoint (HTTP 200) before exiting
- Polls dev server on port 3000 before exiting
- Modelled on existing `make start-prod` pattern

### Chromium Install

- Single `ensure-chromium` guard — checks for presence before installing (idempotent)
- `INSTALL_CHROMIUM=true` respected only during image build, not at runtime
- `make lighthouse-desktop` and `make lighthouse-mobile` call `ensure-chromium`, which is a no-op if Chromium already present

## Functional Requirements

### Deliverable Traceability

| Deliverable | FRs |
|---|---|
| `make start` | FR1, FR2, FR3, FR4 |
| `make ci` | FR5, FR6, FR7, FR8, FR9, FR10, FR11, FR12, FR13, FR14, FR15, FR16 |
| Chromium deduplication | FR17, FR18, FR19, FR20 |
| Documentation | FR21, FR22, FR23 |

### Development Environment Startup

- **FR1:** Developer can start all required development services (frontend dev server + Mockoon) with a single `make start` command
- **FR2:** `make start` waits until the frontend dev server is accepting connections on its port before exiting
- **FR3:** `make start` waits until Mockoon responds HTTP 200 on its health endpoint before exiting
- **FR4:** `make start` exits with a non-zero code if either service fails to reach healthy state within a fixed timeout

### CI Execution

- **FR5:** Developer can run all CI checks with a single `make ci` command
- **FR6:** `make ci` runs preflight checks (format, style gates) sequentially before parallel execution begins
- **FR7:** `make ci` executes lint, unit tests, and TypeScript checks in parallel (Wave 1)
- **FR8:** `make ci` starts the production build and waits for it to be healthy before proceeding
- **FR9:** `make ci` executes E2E, visual regression, and performance/Lighthouse checks in parallel (Wave 2) only after Wave 1 and the production build succeed
- **FR10:** `make ci` skips Wave 2 and exits immediately if Wave 1 or the production build phase fails
- **FR11:** `make ci` exits with a non-zero code if any check fails
- **FR12:** `make ci` output clearly identifies which specific target failed
- **FR13:** Developer can configure the number of parallel jobs via a `JOBS` variable (default: 2 locally)
- **FR14:** The system supports `CI=1` environment variable to switch all Docker exec invocations to direct command execution across all CI targets
- **FR15:** Developer can run all CI checks sequentially via `make ci-sequential` as a fallback
- **FR16:** `make ci-sequential` collects all failing checks and reports them together in a summary at the end rather than stopping at the first failure

### Chromium Management

- **FR17:** The performance test sequence installs Chromium at most once per run
- **FR18:** `ensure-chromium` is a no-op if Chromium is already present
- **FR19:** Running the full Lighthouse sequence (`build-dev-chromium` → `start` → `lighthouse-desktop` → `lighthouse-mobile`) twice does not trigger a second Chromium installation
- **FR20:** `make lighthouse-desktop` and `make lighthouse-mobile` pass after the Chromium deduplication change

### Documentation & Discoverability

- **FR21:** Developer can see that `make start` starts both `dev` and `mockoon` services via `make help`
- **FR22:** Developer can see which CI checks `make ci` runs via `make help`
- **FR23:** Developer can discover `make ci-sequential` as a fallback option via `make help`

## Non-Functional Requirements

### Performance

- **NFR1:** `make start` completes (both services healthy) within 60 seconds on a standard developer machine under normal conditions
- **NFR2:** `make ci` total wall-clock time is less than running all checks sequentially — parallelism must provide a measurable benefit

### Reliability

- **NFR3:** `make start` produces the same result on repeated invocations — starting already-running services must not cause errors
- **NFR4:** `make ci` infrastructure (parallelism, output sync, phase sequencing) must not introduce flakiness beyond what the underlying test targets themselves exhibit

### Maintainability

- **NFR5:** All new Makefile targets follow the existing `## comment` convention so they appear correctly in `make help` output
- **NFR6:** All new targets follow the emoji output style established in `user-service` (`🚀`, `✅`, `❌`) for visual consistency across the VilnaCRM Makefile ecosystem

## Constraints

- **C1:** The implementation introduces zero breaking changes to existing Makefile targets — `make test-unit-all`, `make test-e2e`, and all other existing targets continue to work exactly as before
