---
stepsCompleted:
  [
    'step-01-init',
    'step-02-discovery',
    'step-02b-vision',
    'step-02c-executive-summary',
    'step-03-success',
    'step-04-journeys',
    'step-05-domain',
    'step-06-innovation',
    'step-07-project-type',
    'step-08-scoping',
    'step-09-functional',
    'step-10-nonfunctional',
    'step-11-polish',
    'step-12-complete',
  ]
inputDocuments:
  - 'github:VilnaCRM-Org/crm/issues/49'
workflowType: 'prd'
classification:
  projectType: developer_tool
  domain: general
  complexity: low
  projectContext: brownfield
---

# Product Requirements Document - crm

**Author:** BMad **Date:** 2026-04-10 **Source:**
[VilnaCRM-Org/crm#49](https://github.com/VilnaCRM-Org/crm/issues/49)

## Executive Summary

The CRM frontend project's Makefile is the primary interface between developers and the system — but
three of its most critical targets either deliver incomplete results or don't exist. `make start`
starts only the frontend dev container, silently omitting Mockoon, leaving developers with a running
UI and dead API calls. `make ci` does not exist, meaning there is no single local command that
mirrors CI pipeline execution. `make lighthouse-desktop` and `make lighthouse-mobile` both invoke
`ensure-chromium` independently, introducing redundant Docker exec overhead on every Lighthouse run
even when Chromium is already present in the image.

This PRD defines three surgical fixes. Taken together, they restore the implicit contract of
Makefile targets: a target does exactly what its name says, completely and reliably. The north star
metric: a new contributor runs `make start` and has a fully working development environment —
frontend and API mock — within 5 minutes.

### What Makes This Special

Each fix eliminates a category of silent failure invisible until it wastes a developer's time: API
calls that go nowhere, CI surprises that only surface on push, and redundant setup steps that
accumulate across every performance test run. The "Make targets as contracts" principle, introduced
here, provides a decision framework for evaluating all future Makefile changes — not just the three
addressed in this PRD.

## Project Classification

- **Project Type:** Developer tooling (Makefile targets, Docker orchestration)
- **Domain:** General software development
- **Complexity:** Low — well-understood problem space, no novel technology
- **Project Context:** Brownfield — targeted improvements to an existing CRM frontend project

## Success Criteria

### User Success

- A developer running `make start` gets a fully functional development environment — frontend on
  port 3000 and Mockoon API mock on port 8080 — both verified healthy before the command exits
- A developer running `make ci` gets a definitive local pass/fail that matches what GitHub Actions
  will report — because GitHub Actions itself calls `make ci` as its single source of truth
- Lighthouse audit runs (`make lighthouse-desktop`, `make lighthouse-mobile`) complete without
  redundant Chromium installation steps, regardless of whether the base image includes Chromium

### Business Success

- CI failures that could have been caught locally are eliminated — `make ci` is the canonical check
  suite, called by both developers and GitHub Actions
- New contributors no longer encounter silent API failures from missing Mockoon during their first
  development session
- Performance test pipeline time is reduced by removing redundant Docker exec and `apk add` checks
  on each Lighthouse target invocation

### Technical Success

- `make start` brings up both `dev` and `mockoon` services with health/readiness checks for each
  before returning. Mockoon readiness check method (HTTP health endpoint or TCP port probe) to be
  determined based on Mockoon's capabilities
- **MVP (now):** `make ci` is the canonical non-mutation PR/local CI battery. It runs
  lint-eslint, lint-tsc, lint-md, test-unit-client, and test-unit-server, and GitHub Actions calls
  this exact target.
- **Target state (later):** keep `make ci` as the PR/local CI contract, add `make ci-full` for the
  broader suite that includes `test-integration` and `test-mutation`, and keep `make test` as the
  faster developer test battery.
- `make ci` runs the MVP CI checks (lint-eslint, lint-tsc, lint-md, test-unit-client,
  test-unit-server) in phased parallel execution and exits non-zero if any check fails. Integration
  tests (`test-integration`) and mutation tests (`test-mutation`) are **out of scope** for MVP —
  they can be added post-MVP via a distinct `make ci-full` target once `make ci` is stable
- `make ci` is the single source of truth for CI — GitHub Actions calls `make ci` directly,
  eliminating drift between local and CI check lists
- Chromium presence is determined once per Lighthouse flow, not once per Lighthouse target —
  `ensure-chromium` is called at most once regardless of how many audit targets follow
- No regression in blast-radius targets: `test-unit-client`, `test-unit-server`, `test-mutation`
  (depend on `start`); `test-e2e`, `test-visual`, `test-memory-leak`, `test-load`,
  `lighthouse-desktop`, `lighthouse-mobile` (depend on `start-prod`)

### Measurable Outcomes

- `make start` → both services healthy in <5 minutes on a warm Docker cache. Cold-cache time (first
  clone) is not targeted but should be documented after implementation for contributor guidance
- `make ci` → all MVP checks complete; each parallel phase is limited by its slowest check rather
  than the sum of all checks in that phase
- Lighthouse flow → zero redundant `ensure-chromium` invocations per run

## User Journeys

### Journey 1: New Contributor — First Day Setup (Success Path)

**Persona:** Alex, a junior frontend developer joining VilnaCRM as their first open-source
contribution. Has Docker installed but has never seen this codebase.

**Opening Scene:** Alex clones the repo, reads the README, and runs `make start`. They expect a
working dev environment — that's what the target name promises.

**Rising Action:** Docker pulls images, builds the dev container, and starts both the frontend dev
server and Mockoon API mock. Alex sees health check output in the terminal — both services confirmed
healthy. They open `localhost:3000` and the UI loads. They click through the registration form — API
calls hit Mockoon on port 8080 and return mock responses. Everything works.

**Climax:** Alex makes their first code change, saves, and sees hot-reload update the browser. The
mock API continues responding. There is no moment of confusion, no Slack message asking "why are my
API calls failing?"

**Resolution:** Alex's first PR is focused on the actual feature, not on debugging environment
setup. Onboarding friction: zero.

**Reveals requirements for:** Mockoon service in `start` target, health check for Mockoon, clear
terminal output showing both services are ready.

---

### Journey 2: Existing Developer — Pre-Push Validation (Success Path)

**Persona:** Maria, a senior frontend developer who has been burned by CI failures after pushing.
She wants confidence before she pushes.

**Opening Scene:** Maria finishes a feature branch. She's changed TypeScript files, added a
component, and updated some markdown docs. Before pushing, she runs `make ci`.

**Rising Action:** `make ci` starts the environment, then runs lint checks in parallel, then unit
tests (client and server) in parallel. Maria sees grouped output for each phase. Total wall-clock
time is bounded by the slowest parallel phase, not the sum of every individual check.

**Climax:** All checks pass. Maria pushes with confidence. GitHub Actions runs the same `make ci` —
identical checks, identical result. No surprises.

**Resolution:** Maria's PR passes CI on the first attempt. No wasted review cycles, no "CI is red,
fixing..." follow-up commits.

**Reveals requirements for:** `make ci` target, parallel execution, full-phase completion before
failure reporting, identical check list between local and CI.

---

### Journey 3: GitHub Actions CI (Automated Consumer)

**Persona:** The CI pipeline — an automated system that runs on every push and PR.

**Opening Scene:** A developer pushes a branch. GitHub Actions triggers the CI workflow.

**Rising Action:** The workflow calls `make ci` — the same single command developers run locally. No
separate, hand-maintained list of checks in the YAML file. The Makefile is the single source of
truth.

**Climax:** A lint check fails. `make ci` lets the current lint phase finish, then exits non-zero.
The GitHub Actions job reports failure with clear output showing which checks failed and why.

**Resolution:** The developer sees the failure, runs `make ci` locally, reproduces it instantly,
fixes it, and pushes again. The feedback loop is tight because local and CI are identical.

**Reveals requirements for:** `make ci` as single source of truth, non-zero exit on any failure,
clear per-check output, GitHub Actions workflow updated to call `make ci`.

---

### Journey 4: Performance Engineer — Lighthouse Audit (Edge Case)

**Persona:** Dima, a developer running Lighthouse audits to validate performance before a release.

**Opening Scene:** Dima needs desktop and mobile Lighthouse scores. He runs
`make lighthouse-desktop` followed by `make lighthouse-mobile`.

**Rising Action:** The first target checks for Chromium — it's already baked into the image. The
check completes instantly with "Chromium already installed." The audit runs. When
`lighthouse-mobile` follows, it does NOT re-run the Chromium check — the flow recognizes it was
already verified.

**Climax:** Both audits complete without redundant Docker exec overhead. No wasted time on `apk add`
checks for packages already present.

**Resolution:** The Lighthouse pipeline runs measurably faster. The same flow works identically
whether Chromium was baked into the image via `INSTALL_CHROMIUM=true` or installed at runtime by
`ensure-chromium` — one code path, no duplication.

**Reveals requirements for:** Single `ensure-chromium` invocation per flow, idempotent Chromium
detection, consistent behavior across image variants.

---

### Journey Requirements Summary

- **Journey 1 / MVP:** Mockoon in `start` target.
- **Journey 1 / MVP:** Mockoon health/readiness check.
- **Journey 2, 3 / MVP:** `make ci` parallel execution.
- **Journey 2, 3 / MVP:** `make ci` completes each active phase before reporting failure, with
  clear output.
- **Journey 2, 3 / MVP:** Composable MVP CI sub-targets (`ci-setup`, `ci-lint`, `ci-test`).
- **Journey 3 / MVP:** GitHub Actions calls `make ci` as the single source of truth.
- **Journey 4 / MVP:** Single `ensure-chromium` per Lighthouse flow.
- **Journey 4 / MVP:** Idempotent Chromium detection across image variants.

## Developer Tooling Requirements

All changes are confined to `Makefile`, Docker Compose files, GitHub Actions workflows, and
`README.md`. No application code is modified.

### Parallel Execution Model

Following the
[user-service `make ci` pattern](https://github.com/VilnaCRM-Org/user-service/blob/main/Makefile):

- Use `$(MAKE) -j --output-sync=target` for Make-native parallelism
- Group checks into sequential phases; parallelize within phases
- Provide MVP sub-targets (`ci-setup`, `ci-lint`, `ci-test`) for composability; deeper subset
  controls remain Post-MVP
- Consider a `ci-sequential` fallback target for debugging

### Chromium Deduplication Strategy

- Extract `ensure-chromium` call out of `LHCI_BUILD_CMD`
- Create a `lighthouse-setup` target that calls `ensure-chromium` + `start-prod` once
- Both `lighthouse-desktop` and `lighthouse-mobile` depend on `lighthouse-setup`
- Use Make's dependency resolution to guarantee single execution

### Implementation Considerations

- `make ci` must work both inside Docker (local dev) and in DIND (GitHub Actions) — follow
  user-service's `CI=1` conditional pattern if needed
- Health check for Mockoon: verify whether Mockoon exposes a health endpoint; fall back to TCP port
  probe if not
- `--output-sync=target` requires GNU Make 4.0+ — verify CI runner Make version

## Project Scoping & Phased Development

### MVP Strategy

Problem-solving MVP — fix three specific broken/missing developer workflow targets. Single
developer, familiar with Make and Docker Compose. No backend or application code changes.

### MVP Feature Set (Phase 1)

1. `make start` brings up `dev` + `mockoon`, both health-checked
2. `make ci` runs lint + unit tests in phased parallel execution via `ci-setup`, `ci-lint`, and
   `ci-test`
3. Composable MVP CI sub-targets `ci-setup`, `ci-lint`, and `ci-test` are included; arbitrary
   subset selection remains Post-MVP
4. GitHub Actions workflow updated to call `make ci`
5. `ensure-chromium` invoked at most once per Lighthouse flow
6. README updated with new target documentation

### Critical Scoping Decisions

These must be resolved before implementation begins:

#### 1. Mockoon Docker Compose Placement

Mockoon currently lives only in `docker-compose.test.yml`. Since `make start` now needs it, a
decision is required:

- Option A: Move Mockoon to `docker-compose.yml`, remove from test file, update all test references
- Option B: Keep in test file, add `extends` or `-f` include from main compose
- Option C: Define in main `docker-compose.yml`, reference from test via override

**Blast radius:** `start-prod`, `test-e2e`, `test-visual`, `test-memory-leak` all use
`docker-compose.test.yml` where Mockoon currently lives. `patch-prod-mockoon-url` references the
Mockoon service. Any move must preserve these paths.

**2. `make ci` phase structure**

Flat parallelism is NOT safe unless the environment start step is idempotent.
`test-unit-client` and `test-unit-server` both internally call `make start` via the `UNIT_TESTS`
variable (`make start && $(EXEC_DEV_TTYLESS) env`). `make start` MUST detect an already-running
environment (for example by checking expected Docker containers/networks or an equivalent lock) and
exit no-op when `dev` and `mockoon` are already healthy, so existing `test-unit-client` and
`test-unit-server` targets remain unchanged and safe for local workflows. `make ci` still MUST use
phased execution:

- Phase 1: Start environment (sequential)
- Phase 2: Lint checks (parallel via `-j`)
- Phase 3: Test execution against already-running environment (parallel, preferably through
  CI-specific environment-assuming sub-targets that do not call `make start`)

If new no-start sub-targets such as `ci-test-unit-client` and `ci-test-unit-server` are added, they
are additive CI-specific targets only. Keep the original `test-unit-client` and `test-unit-server`
targets unchanged, and document the CI-specific/local split in Makefile comments.

### Delivery Strategy

- Commit 1: `make start` + Mockoon (highest risk — may touch test infrastructure depending on
  Compose decision; if complex, split into its own PR)
- Commit 2: `make ci` with phased parallel execution (independent)
- Commit 3: Chromium deduplication (independent)
- Commits 2 and 3 are safe regardless of commit 1's complexity

### Post-MVP Features (Phase 2)

- Add `test-integration` to `make ci-full`
- Configurable `CI_TARGETS` env var for running subsets locally
- `ci-sequential` fallback target (following user-service pattern)
- Unified health-check utility across all wait targets
- `make ci` per-check timing output

### Vision (Phase 3)

- "Make targets as contracts" documented as a contributing standard, enforced in code review
- All Makefile targets self-documenting with consistent `make help` output
- Potential `make ci-full` that includes performance and visual regression tests

### Risk Mitigation

**Technical Risks:**

- GNU Make `-j` + `--output-sync` requires Make 4.0+ — **mitigation:** verify CI runner version;
  Alpine and Ubuntu runners ship Make 4.x+
- Mockoon health endpoint may not exist — **mitigation:** fall back to TCP port probe
- **Race condition in parallel test execution** — `test-unit-client` and `test-unit-server` both
  call `make start` internally — **mitigation:** `make ci` starts the environment once in a
  preflight phase, then runs only test commands in parallel
- Docker Compose reorganization for Mockoon may ripple into `start-prod` and all test targets —
  **mitigation:** scope the Compose decision upfront; if blast radius is large, isolate into its own
  PR

**Resource Risks:**

- Single developer can deliver all three fixes — if constrained, commits 2 and 3 are fully
  independent and can ship without commit 1

## Functional Requirements

### Development Environment Setup

- FR1: Developer can start a complete development environment with a single `make start` command
- FR2: `make start` can bring up the frontend dev server and Mockoon API mock server simultaneously
- FR3: `make start` can verify health/readiness of both dev and Mockoon services before returning
  control to the developer
- FR4: `make start` can report clear status output indicating which services are healthy and ready
- FR5: `make start` can fail with non-zero exit and clear error output if any service fails its
  health check
- FR6: Developer can access the frontend application on port 3000 with functioning API mock
  responses on port 8080 after `make start` completes

### CI Check Execution

- FR7: Developer can run all MVP CI checks locally with a single `make ci` command
- FR8: `make ci` can produce consistent, correct results regardless of whether the development
  environment is already running or not
- FR9: `make ci` can reuse an already-running development environment without restarting services
- FR10: `make ci` can exit with non-zero status if any check fails
- FR11: Developer can identify which specific check failed and its output from `make ci` results
- FR12: Developer can run MVP CI phases via composable sub-targets (`ci-setup`, `ci-lint`,
  `ci-test`). Fine-grained configurable subsets such as arbitrary target selection are Post-MVP.

### CI Pipeline Integration

- FR13: GitHub Actions CI workflow can delegate all check execution to `make ci` without maintaining
  a separate check list
- FR14: `make ci` can produce identical results whether run locally or in GitHub Actions

### Performance Test Efficiency

- FR15: Lighthouse flow can verify Chromium presence at most once per execution, regardless of how
  many audit targets follow
- FR16: `make lighthouse-desktop` and `make lighthouse-mobile` can run sequentially without
  redundant Chromium setup
- FR17: Chromium detection can work identically whether Chromium was baked into the Docker image or
  installed at runtime

### Documentation

- FR18: Developer can find documentation for `make start` behavior (both services, health checks) in
  README
- FR19: Developer can find documentation for `make ci` usage and its relationship to GitHub Actions
  in README
- FR20: Developer can discover new/changed targets via `make help` output
- FR21: README and matching `docs/` guidance describe the new `make ci` target and its relationship
  to GitHub Actions, the changed `make start` behavior and health-check expectations, and the
  `make help` output entries for new/changed targets.
- FR22: Developer migration documentation explains how to transition from the old `make start`
  behavior to the new `make start` flow with Mockoon readiness, and how CI now invokes `make ci`.

## Traceability Matrix

The table below maps each functional requirement to its implementing Epic and Story IDs so reviewers
can verify end-to-end coverage.

| FR | Epic | Stories | Coverage |
| -- | ---- | ------- | -------- |
| FR1 | EPIC-1 | 1.2 | Single `make start` starts both services |
| FR2 | EPIC-1 | 1.1, 1.2 | Mockoon moved, then co-started with frontend |
| FR3 | EPIC-1 | 1.3 | `wait-for-dev` and `wait-for-mockoon` gate return |
| FR4 | EPIC-1 | 1.3 | Readiness and waiting messages print per service |
| FR5 | EPIC-1 | 1.3 | Timeout exits non-zero with failure message |
| FR6 | EPIC-1 | 1.2 | Frontend and Mockoon ports work after start |
| FR7 | EPIC-2 | 2.4 | Top-level `make ci` orchestration target |
| FR8 | EPIC-2 | 2.1, 2.4 | `ci-setup` handles any prior service state |
| FR9 | EPIC-2 | 2.1 | `--no-recreate` reuses running services locally |
| FR10 | EPIC-2 | 2.4 | Failing phases propagate non-zero exit |
| FR11 | EPIC-2 | 2.2, 2.3 | `--output-sync=target` groups per-check output |
| FR12 | EPIC-2 | 2.1, 2.2, 2.3 | `ci-setup`, `ci-lint`, `ci-test` are runnable |
| FR13 | EPIC-3 | 3.1 | GitHub Actions delegates to `make ci` |
| FR14 | EPIC-2 | 2.1, 2.4 | Local and GitHub Actions use the same code path |
| FR15 | EPIC-4 | 4.1 | `lighthouse-setup` runs at most once per Make |
| FR16 | EPIC-4 | 4.2 | Desktop and mobile depend on `lighthouse-setup` |
| FR17 | EPIC-4 | 4.1 | Chromium detection handles both image variants |
| FR18 | EPIC-5 | 5.1 | README documents `make start` and health checks |
| FR19 | EPIC-5 | 5.2 | Docs link `make ci` to GitHub Actions |
| FR20 | EPIC-5 | 5.3 | `make help` exposes new and changed targets |
| FR21 | EPIC-5 | 5.1, 5.2, 5.3 | README and docs cover start, ci, and help |
| FR22 | EPIC-5 | 5.4 | CONTRIBUTING covers start and CI migration |

## Non-Functional Requirements

### Performance

- NFR1: `make start` completes with both services healthy in under 5 minutes on a warm Docker cache
- NFR2: `make ci` uses sequential setup, lint, and test phases; each parallel check phase is bounded
  by its slowest check, not the sum of all checks in that phase
- NFR3: No Chromium package installation step executes when Chromium is already present in the
  container — only the presence check runs

### Reliability

- NFR4: `make ci` produces deterministic results — running it twice on the same code yields the same
  pass/fail outcome
- NFR5: `make start` completes successfully regardless of whether services are already running,
  stopped, or not yet created
- NFR6: `make ci` completes successfully regardless of whether the development environment is
  already running, stopped, or not yet created
- NFR7: Parallel check execution does not introduce flaky failures due to resource contention or
  race conditions

### Failure Behavior

- NFR8: When a check fails during `make ci`, all checks within the same phase complete before
  `make ci` reports failure, so developers see all failures in a single run
- NFR9: If `make ci` environment setup fails, no subsequent check phases execute
- NFR10: Developer can determine which checks passed and which failed from `make ci` summary output
  without reading individual check logs

### Compatibility

- NFR11: `make ci` requires only GNU Make 4.0+ (available on Alpine 3.x, Ubuntu 20.04+, and macOS
  with Homebrew make)
- NFR12: All new/changed targets work in both local Docker Compose and DIND (Docker-in-Docker) CI
  environments
- NFR13: No new host-level dependencies introduced — only Docker, Make, and existing project tooling
  required
