---
stepsCompleted: [1, 2, 3, 4, 5, 6, 7, 8]
lastStep: 8
status: 'complete'
completedAt: '2026-04-14'
inputDocuments:
  - 'specs/planning-artifacts/prd-start-ci-chromium-2026-04-10.md'
workflowType: 'architecture'
project_name: 'crm'
user_name: 'BMad'
date: '2026-04-14'
---

# Architecture Decision Document

_This document builds collaboratively through step-by-step discovery. Sections are appended as we
work through each architectural decision together._

## Project Context Analysis

### Requirements Overview

**Functional Requirements:** 22 FRs across five capability areas: development environment setup
(FR1–FR6), CI check execution (FR7–FR12), CI pipeline integration (FR13–FR14), performance test
efficiency (FR15–FR17), and documentation (FR18–FR22). The scope is confined to Makefile targets,
Docker Compose files, and GitHub Actions workflows — no application code is modified.
Architecturally this is a repository workflow initiative: three targeted fixes that restore the
implicit contract that a Make target does exactly what its name says, completely and reliably.

**Non-Functional Requirements:** 13 NFRs in four groups — performance (NFR1–NFR3), reliability
(NFR4–NFR7), failure behavior (NFR8–NFR10), and compatibility (NFR11–NFR13). Key constraints:
`make start` completes in <5 min on warm cache; `make ci` wall-clock time bounded by slowest
parallel phase; zero redundant Chromium install steps; GNU Make 4.0+ required for
`--output-sync=target`; all targets must work in local Docker Compose and DIND CI environments.

**Scale & Complexity:**

- Primary domain: Infrastructure / developer tooling (Makefile, Docker Compose, GitHub Actions)
- Complexity level: Low — well-understood problem space, no novel technology
- Estimated architectural components: 3 core fix areas + 1 overarching principle

### Architectural Principles

**"Make targets as contracts"**: A target does exactly what its name says, completely and reliably.
This principle cross-cuts all three fixes and provides the decision framework for evaluating all
future Makefile changes — not just the three addressed in this PRD. It must be codified explicitly
in this architecture document so future contributors have it as a reference point.

**Environment-owning vs environment-assuming targets**: A critical architectural split that arises
from the `make ci` phased execution requirement. Some targets are responsible for bringing up the
Docker environment (`make start`, `make start-prod`); others must assume the environment is already
running. Current unit test targets conflate both concerns by calling `make start` internally.
`make ci` requires decomposing these into separate, composable sub-targets — one layer that owns
environment lifecycle, one layer that only executes checks against a running environment.

### Technical Constraints & Dependencies

- **GNU Make 4.0+**: Required for `$(MAKE) -j --output-sync=target`. Available on Alpine 3.x, Ubuntu
  20.04+, macOS Homebrew make. **Open architectural decision:** hard prerequisite (document in
  contributing guidelines) vs graceful detection with `ci-sequential` fallback. macOS system Make
  ships at 3.81 — this will affect contributor experience without explicit guidance.
- **Docker Compose topology** _(highest-risk decision)_: Mockoon currently in
  `docker-compose.test.yml` only. Any move has blast-radius against `start-prod`, `test-e2e`,
  `test-visual`, `test-memory-leak`, `test-load`, `patch-prod-mockoon-url`. Three options exist
  (move to main compose, extends/include, override file) — a recommended option must be established
  in Step 4 before implementation begins.
- **Mockoon health check method**: Whether Mockoon exposes an HTTP health endpoint or requires a TCP
  port probe must be determined at implementation time.
- **DIND compatibility**: `make ci` must work inside Docker (local) and Docker-in-Docker (GitHub
  Actions). Follow user-service `CI=1` conditional pattern if needed.
- **Race condition constraint**: `test-unit-client` and `test-unit-server` both call `make start`
  internally — flat parallelism in `make ci` is not safe. Phased execution with environment-assuming
  sub-targets is required.

### Cross-Cutting Concerns Identified

1. **Phased execution model** — mandatory for `make ci`; shapes all sub-target decomposition across
   the CI capability area.
2. **Environment ownership split** — the architectural boundary between targets that own environment
   lifecycle and targets that assume a running environment; must be consistently applied across all
   three fix areas.
3. **Health-check pattern** — Mockoon readiness check design should be consistent with existing wait
   patterns; reusable across future services.
4. **Unit test parallelism statefulness** — open question: are `test-unit-client` and
   `test-unit-server` truly stateless with respect to each other when run in parallel? Port
   conflicts, `/tmp` writes, or shared state could introduce flakiness. Must be confirmed before
   Phase 3 of `make ci` is finalized.
5. **Make version compatibility** — `--output-sync=target` flag requires a deliberate fallback
   strategy; decision needed in Step 4.
6. **Idempotency requirement** — all modified targets must handle already-running, stopped, and
   not-yet-created container states without error.

## Starter Template Evaluation

### Primary Technology Domain

Infrastructure / developer tooling — brownfield modifications to existing Makefile, Docker Compose,
and GitHub Actions configuration files.

### Starter Template Decision: Not Applicable — Reference Pattern Adopted

This PRD introduces no new application, service, or library. All changes are targeted modifications
to existing repository infrastructure files:

- `Makefile` — add/modify targets
- `docker-compose.yml` — potentially add Mockoon service
- `docker-compose.test.yml` — potentially reorganize Mockoon placement
- `.github/workflows/*.yml` — update to delegate to `make ci`
- `README.md` — document new and changed targets

**Reference implementation:** The user-service repository's `make ci` pattern —
`$(MAKE) -j --output-sync=target` with phased structure — serves as the de facto starter reference
for this project. It provides proven answers to the parallelism design, phase structure, and output
synchronization decisions.

### Existing Conventions (Pre-Made Decisions)

These patterns are already established in the codebase and must be consistently followed in all
new/modified targets:

- **TTY-less container exec:** `$(EXEC_DEV_TTYLESS)` means `docker compose exec -T dev`.
  Use it for all non-interactive commands in the dev container.
- **Unit test invocation:** `UNIT_TESTS = make start && $(EXEC_DEV_TTYLESS) env`.
  This is the pattern to decompose for `make ci`.
- **Lighthouse build sequence:** `LHCI_BUILD_CMD` currently chains Chromium setup,
  production startup, and `$(LHCI)`. This is the pattern to fix for Chromium dedup.
- **Dev compose file:** `DOCKER_COMPOSE_DEV_FILE = -f docker-compose.yml`.
  It is used by `start`, `ensure-chromium`, and `build`.
- **Test compose file:** `DOCKER_COMPOSE_TEST_FILE = -f docker-compose.test.yml`.
  It is used by `start-prod` and all prod-dependent targets.
- **Health checks overlay:** `COMMON_HEALTHCHECKS_FILE = -f common-healthchecks.yml`.
  It is applied alongside the test compose file for `start-prod`.
- **Target documentation:** `## Description text` inline comments power `make help`;
  all new public targets must include them.

### Blast-Radius Inventory

Targets that must not regress after our three fixes. These define the acceptance baseline equivalent
to what a starter template provides for greenfield work.

**Targets depending on `make start` (dev environment):**

- `test-unit-client`: direct risk via `UNIT_TESTS` → `make start`.
- `test-unit-server`: direct risk via `UNIT_TESTS` → `make start`.
- `test-integration`: direct risk via `UNIT_TESTS` → `make start`.
- `test-mutation`: direct risk via `STRYKER_CMD` → `make start`.

**Targets depending on `make start-prod` (test environment):**

- `test-e2e`, `test-e2e-ui`, `test-visual`, `test-visual-ui`, and
  `test-visual-update`: indirect risk through the `start-prod` prerequisite.
- `test-memory-leak`, `test-load`, and `test-load-signup`: indirect risk through
  the `start-prod` prerequisite.
- `lighthouse-desktop`: direct risk through `LHCI_BUILD_CMD`, `ensure-chromium`,
  and `start-prod`.
- `lighthouse-mobile`: direct risk through `LHCI_BUILD_CMD`, `ensure-chromium`,
  and `start-prod`.

**Compose file references to preserve:**

- `patch-prod-mockoon-url` — references Mockoon service; must remain valid after Compose topology
  change
- Any `docker-compose.test.yml` service references used in test targets above

## Core Architectural Decisions

### Decision Priority Analysis

**Critical Decisions (Block Implementation):**

1. Docker Compose topology for Mockoon — gates `make start` implementation
2. `make ci` phase structure — gates parallel test execution design
3. Chromium deduplication pattern — gates Lighthouse target restructuring

**Important Decisions (Shape Architecture):**

1. GNU Make version strategy — affects contributor experience and CI setup
2. Mockoon health check mechanism — affects `make start` reliability contract

**Deferred Decisions (Post-MVP):**

- `ci-sequential` fallback target (Phase 2)
- `CI_TARGETS` env var for running subsets (Phase 2)
- Unified health-check utility (Phase 2)

---

### Docker Compose Topology

**Decision:** Move Mockoon service definition to `docker-compose.yml`; remove from
`docker-compose.test.yml`.

**Rationale:** Mockoon is a development dependency (API mock for the dev environment), not solely a
test dependency. Placing it in the dev compose file reflects its true ownership. This enables
`make start` to bring it up using the existing `DOCKER_COMPOSE_DEV_FILE` flag without introducing
additional compose file flags.

**Cascading implication — `start-prod` must be updated:** `start-prod` currently uses only
`-f docker-compose.test.yml`. Once Mockoon lives in `docker-compose.yml`, `start-prod` must
reference both compose files but limit the services it starts:

```makefile
start-prod: create-network
    $(DOCKER_COMPOSE) $(DOCKER_COMPOSE_DEV_FILE) $(DOCKER_COMPOSE_TEST_FILE) \
        $(COMMON_HEALTHCHECKS_FILE) up -d --no-recreate prod mockoon playwright
    make wait-for-prod-health
```

**`--no-recreate` trade-off:** If Mockoon is already running (from a prior `make start`),
`--no-recreate` will not recreate it — intentional for idempotency. If Mockoon's config changed
between invocations, the old instance persists silently. Acceptable for MVP; add a comment in the
Makefile to document this behaviour.

**Files affected:**

- `docker-compose.yml` — add Mockoon service (with existing Docker healthcheck)
- `docker-compose.test.yml` — remove Mockoon service
- `Makefile` — update `start-prod` to use both compose files with explicit service names; update
  `make start` to bring up `dev mockoon` instead of just `dev`

**`patch-prod-mockoon-url` impact:** Service name remains `mockoon`; only the file it is defined in
changes. No change needed to the target itself.

---

### `make ci` Phase Structure

**Decision:** Three-phase sequential→parallel→parallel execution using
`$(MAKE) -j --output-sync=target`. New env-assuming sub-targets use `ci-` prefix to distinguish them
from standalone developer-facing targets.

**Phase structure:**

```makefile
# Phases run sequentially by recipe order. Do NOT express these as
# prerequisites; GNU Make may run prerequisites in parallel under -j.
ci:
    $(MAKE) ci-setup
    $(MAKE) ci-lint
    $(MAKE) ci-test

ci-setup:
ifeq ($(CI),1)
    $(DOCKER_COMPOSE) $(DOCKER_COMPOSE_DEV_FILE) up -d --build dev mockoon
else
    $(DOCKER_COMPOSE) $(DOCKER_COMPOSE_DEV_FILE) up -d --no-recreate dev mockoon
endif
    make wait-for-dev
    make wait-for-mockoon

ci-lint:
    $(MAKE) -j --output-sync=target lint-eslint lint-tsc lint-md

ci-test:
    $(MAKE) -j --output-sync=target ci-test-unit-client ci-test-unit-server

ci-test-unit-client:
    $(EXEC_DEV_TTYLESS) env TEST_ENV=client $(JEST_CMD) $(JEST_FLAGS)

ci-test-unit-server:
    $(EXEC_DEV_TTYLESS) env TEST_ENV=server $(JEST_CMD) $(JEST_FLAGS) $(TEST_DIR_APOLLO)
```

**Naming rationale:** `ci-test-unit-client` / `ci-test-unit-server` use the `ci-` prefix —
consistent with `ci-setup`, `ci-lint`, `ci-test`. These are ci-context sub-targets that assume a
running environment. The existing `test-unit-client` / `test-unit-server` (which own environment
lifecycle via `UNIT_TESTS = make start && ...`) remain unchanged for direct developer use.

**Unit test parallelism safety (resolved):** `ci-test-unit-client` and `ci-test-unit-server` are
safe to run in parallel. They use different `TEST_ENV` values, target non-overlapping test
directories (`tests/unit/**` vs `tests/apollo-server/**`), and write no shared file paths inside the
container. Jest's `--maxWorkers=2` limits internal concurrency per instance independently.

**`ci-setup` environment awareness:** Uses `CI=1` conditional — `--build` in CI (fresh environment,
image must be current), `--no-recreate` locally (avoid unnecessary rebuilds on repeated `make ci`
runs). Consistent with the user-service reference pattern.

**GitHub Actions update:** The CI workflow replaces its hand-maintained check list with a single
`make ci` call. `make ci` is the single source of truth.

---

### Chromium Deduplication

**Decision:** Extract `ensure-chromium` and `start-prod` into a shared `lighthouse-setup`
prerequisite target. Both `lighthouse-desktop` and `lighthouse-mobile` depend on it.
`LHCI_BUILD_CMD` variable is removed.

```makefile
lighthouse-setup: ensure-chromium start-prod
    @echo "✅ Lighthouse environment ready"

lighthouse-desktop: lighthouse-setup ## Run Lighthouse audit (desktop)
    $(LHCI) $(LHCI_CONFIG_DESKTOP) $(LHCI_CHROME_PATH_ARG) $(LHCI_CHROME_FLAGS_ARG)

lighthouse-mobile: lighthouse-setup ## Run Lighthouse audit (mobile)
    $(LHCI) $(LHCI_CONFIG_MOBILE) $(LHCI_CHROME_PATH_ARG) $(LHCI_CHROME_FLAGS_ARG)
```

**Rationale:** GNU Make's dependency graph guarantees `lighthouse-setup` runs at most once per Make
invocation, regardless of how many targets depend on it. No conditional logic or sentinel files
required. `LHCI_BUILD_CMD` is removed — any future Lighthouse targets must use `lighthouse-setup` as
a prerequisite.

---

### GNU Make Version Strategy

**Decision:** Hard prerequisite. GNU Make 4.0+ is required for `--output-sync=target`. Document in
`CONTRIBUTING.md` and `README.md`. macOS contributors: `brew install make` (provides `gmake` 4.x).
No in-Makefile version detection or `ci-sequential` fallback for MVP.

**Rationale:** CI runners (Alpine Linux, Ubuntu 20.04+) all ship Make 4.x. Adding a version guard
adds complexity for a case that will not occur in CI and is a one-time `brew install` fix for
affected local contributors. Consistent with the user-service reference pattern.

---

### Mockoon Health Check

**Decision:** TCP port probe via `wait-on`, consistent with the `wait-for-prod` pattern.
`MOCKOON_PORT` defined as a Make variable alongside `DEV_PORT` and `PROD_PORT`.

```makefile
MOCKOON_PORT    ?= 8080

wait-for-mockoon: ## Wait for Mockoon API mock to be ready on port $(MOCKOON_PORT)
    @echo "Waiting for Mockoon on tcp:$(WEBSITE_DOMAIN):$(MOCKOON_PORT)..."
    @$(BUNX) wait-on tcp:$(WEBSITE_DOMAIN):$(MOCKOON_PORT) --timeout 60000 || \
        (echo "❌ Mockoon failed to start"; exit 1)
    @echo "✅ Mockoon is ready"
```

**Variable consistency:** `$(MOCKOON_PORT)` uses Make variable expansion throughout — consistent
with `$(DEV_PORT)` and `$(PROD_PORT)`. The shell `${MOCKOON_PORT:-8080}` form is not used.

**Note:** The Mockoon service definition already includes a Docker healthcheck (`wget` probe against
`/api/users`). That healthcheck remains in place for container-level health reporting.
`wait-for-mockoon` provides the external readiness gate in `make start`.

**`make start` updated target:**

```makefile
start: create-network ## Start the application (frontend + Mockoon API mock)
    $(DOCKER_COMPOSE) $(DOCKER_COMPOSE_DEV_FILE) up -d --build dev mockoon
    make wait-for-dev
    make wait-for-mockoon
```

---

### Decision Impact Analysis

**Implementation Sequence:**

1. Docker Compose topology change (highest risk — gates `make start`; own PR if `start-prod` blast
   radius is significant)
2. `make start` update + `wait-for-mockoon` (depends on #1)
3. `make ci` phase structure + GitHub Actions update (independent of #1)
4. Chromium deduplication via `lighthouse-setup` (independent of #1)
5. README / CONTRIBUTING documentation (last — documents the final state)

**Cross-Component Dependencies:**

- `start-prod` update is a mandatory cascading change from the Compose topology decision; it must
  ship in the same commit as the Mockoon move
- `ci-test-unit-client` / `ci-test-unit-server` sub-targets are required for Phase 3 parallel safety
  — they must exist before `ci-test` can use `-j`
- Removing `LHCI_BUILD_CMD` is a hard dependency of the Chromium deduplication change; any
  references to it must be updated in the same commit

## Implementation Patterns & Consistency Rules

### Context

This project modifies infrastructure files (Makefile, Docker Compose, GitHub Actions YAML). Standard
application patterns (API format, component naming) don't apply. Conflict points are specific to
Makefile authoring conventions and Docker Compose service definition patterns.

---

### Naming Patterns

**Makefile Target Naming:**

- All targets: `kebab-case` (e.g. `wait-for-mockoon`, `ci-test-unit-client`)
- Environment-owning targets: plain noun/verb form (`start`, `start-prod`, `test-unit-client`)
- Environment-assuming CI sub-targets: `ci-` prefix (`ci-setup`, `ci-lint`, `ci-test`,
  `ci-test-unit-client`, `ci-test-unit-server`)
- Wait/readiness targets: `wait-for-<service>` (`wait-for-dev`, `wait-for-mockoon`,
  `wait-for-prod-health`)
- Setup/prerequisite targets: `<scope>-setup` (`lighthouse-setup`)

**Makefile Variable Naming:**

- All variables: `UPPER_SNAKE_CASE`
- Port variables: `<SERVICE>_PORT` (`DEV_PORT`, `PROD_PORT`, `MOCKOON_PORT`)
- Compose file flag variables: `DOCKER_COMPOSE_<SCOPE>_FILE`
- Command variables: `<SCOPE>_CMD` or `<SCOPE>_BIN`
- Never use shell `${VAR:-default}` inside Makefile variable definitions — use Make's `?=`
  assignment operator for defaults

**Docker Compose Service Naming:**

- All service names: `kebab-case`, lowercase (`dev`, `prod`, `mockoon`, `playwright`, `memory-leak`)
- Service names must be stable across compose files — never rename a service that is referenced by
  name in Makefile variables or targets

---

### Structure Patterns

**Makefile Section Order:** New targets must be added in the appropriate section, consistent with
the existing grouping:

1. Environment setup variables (top of file)
2. Port/domain variables
3. Command/binary variables
4. `.PHONY` declarations
5. `help` target
6. Environment lifecycle targets (`start`, `start-prod`, `wait-for-*`)
7. Build targets
8. Lint targets
9. Test targets (unit, e2e, visual, performance)
10. Utility targets (`down`, `sh`, `ps`, `logs`)

**Target Documentation:** Every public target must have an inline `## Description` comment for
`make help`:

```makefile
wait-for-mockoon: ## Wait for Mockoon API mock to be ready on port $(MOCKOON_PORT)
```

Internal/prerequisite-only targets (e.g. `ci-test-unit-client`) do not require `## Description`
comments.

**Docker Compose File Boundaries:**

- `docker-compose.yml` — services needed during active development (`dev`, `mockoon`)
- `docker-compose.test.yml` — services needed for test execution (`prod`, `playwright`, `k6`)
- `common-healthchecks.yml` — healthcheck definitions shared across files
- Do not add test-only services to `docker-compose.yml`; do not add dev-only services to
  `docker-compose.test.yml`

---

### Format Patterns

**Makefile Health Check Targets:** All `wait-for-*` targets follow the same structure:

```makefile
wait-for-<service>: ## Wait for <service> to be ready on port $(<PORT_VAR>)
    @echo "Waiting for <service> on <probe-type>:$(WEBSITE_DOMAIN):$(<PORT_VAR>)..."
    @<probe-command> || (echo "❌ <service> failed to start"; exit 1)
    @echo "✅ <service> is ready"
```

**Status Message Convention:**

- Waiting: plain `echo "Waiting for X..."`
- Success: `echo "✅ X is ready"` or `echo "✅ X is up and running!"`
- Failure: `echo "❌ X failed to start"` followed by `exit 1`
- Ongoing: `printf "."` (no newline, for progress dots)

**Conditional CI/Local Blocks:**

```makefile
target:
ifeq ($(CI),1)
    <ci-specific recipe>
else
    <local recipe>
endif
```

Only use `CI=1` conditional when behaviour must genuinely differ between CI and local. Do not use it
to skip steps locally that should always run.

---

### Communication Patterns

**How Targets Call Other Targets:**

- Use Make prerequisites for **guaranteed single execution** and **dependency ordering**:
  `lighthouse-desktop: lighthouse-setup`
- Use `make <target>` recursive calls for **explicit sequential steps** within a recipe where the
  sub-target is not a dependency: `make wait-for-dev` on its own line after `up -d`
- Use `$(MAKE) -j --output-sync=target` for **safe parallel execution** within a phase:
  `$(MAKE) -j --output-sync=target lint-eslint lint-tsc lint-md`
- Never mix prerequisites and recursive `make` calls for the same logical step

**Environment Variable Passing:** Pass env vars inline in the recipe when the variable is
test-context-specific:

```makefile
ci-test-unit-client:
    $(EXEC_DEV_TTYLESS) env TEST_ENV=client $(JEST_CMD) $(JEST_FLAGS)
```

---

### Process Patterns

**Idempotency:** Every modified or new target must handle the "already running" case without error:

- Docker Compose: use `--no-recreate` for services that may already be up
- Network creation:
  `docker network ls | grep -wq $(NETWORK_NAME) || docker network create $(NETWORK_NAME)` (existing
  pattern — reuse)
- Health checks: `wait-on` times out cleanly with non-zero exit and a human-readable error

**Error Exit Pattern:** Always pair a `❌` message with `exit 1`. Never silently swallow errors:

```makefile
# Correct
@<command> || (echo "❌ Reason for failure"; exit 1)

# Wrong — swallows exit code
@<command> || true
```

---

### Enforcement Guidelines

**All implementation agents MUST:**

- Follow the `kebab-case` target naming convention without exception
- Include `## Description` on every public target
- Define new port variables with `?=` default alongside existing port variables
- Use `$(MOCKOON_PORT)` Make expansion — never `${MOCKOON_PORT:-8080}` shell syntax
- Place new targets in the correct Makefile section (see Structure Patterns above)
- Pair every `make start`-style env-owning call with a `wait-for-*` health gate
- Never parallelize phases within `make ci` at the top level; only parallelize within `ci-lint` and
  `ci-test`

**Anti-Patterns to Avoid:**

- Do not define `MOCKOON_PORT ?= 8080` twice. Define it once near `DEV_PORT` and
  `PROD_PORT`.
- Do not use shell syntax like `${MOCKOON_PORT:-8080}`. Use `$(MOCKOON_PORT)`
  Make expansion.
- Do not express top-level CI phases as `ci: ci-setup ci-lint ci-test`; GNU Make
  may run prerequisites in parallel under `-j`. Keep top-level CI phases
  sequential with explicit recipe calls.
- Do not add services to the wrong compose file. Follow compose file boundary
  rules.
- Do not use a `wait-on` probe without a timeout. Always pass `--timeout 60000`.
- Do not create health targets without an error message. Echo the failure reason
  before `exit 1`.

## Project Structure & Boundaries

### Requirements to File Mapping

- **Dev environment setup (FR1-FR6):** `Makefile`, `docker-compose.yml`,
  and `docker-compose.test.yml`.
- **CI check execution (FR7-FR12):** `Makefile`.
- **CI pipeline integration (FR13-FR14):** `.github/workflows/ci.yml` and
  `Makefile`.
- **Performance test efficiency (FR15-FR17):** `Makefile`.
- **Documentation (FR18-FR22):** `README.md` and new `CONTRIBUTING.md`.

---

### Complete File Change Map

```text
crm/
├── Makefile                              ← PRIMARY CHANGE FILE
│   ├── Variables section
│   │   ├── ADD: MOCKOON_PORT ?= 8080    (alongside DEV_PORT, PROD_PORT)
│   │   └── REMOVE: LHCI_BUILD_CMD
│   ├── Environment lifecycle section
│   │   ├── MODIFY: start               (add mockoon service + wait-for-mockoon)
│   │   ├── MODIFY: start-prod          (add dev compose + explicit services)
│   │   └── ADD: wait-for-mockoon       (TCP probe via wait-on)
│   ├── CI section (NEW)
│   │   ├── ADD: ci                     (sequential recipe calls: ci-setup, ci-lint, ci-test)
│   │   ├── ADD: ci-setup               (env bring-up with CI=1 conditional)
│   │   ├── ADD: ci-lint                (parallel: lint-eslint lint-tsc lint-md)
│   │   ├── ADD: ci-test                (parallel: ci-test-unit-client ci-test-unit-server)
│   │   ├── ADD: ci-test-unit-client    (env-assuming Jest client run)
│   │   └── ADD: ci-test-unit-server    (env-assuming Jest server run)
│   └── Lighthouse section
│       ├── ADD: lighthouse-setup       (ensure-chromium + start-prod prerequisite)
│       ├── MODIFY: lighthouse-desktop  (depends on lighthouse-setup, remove LHCI_BUILD_CMD)
│       └── MODIFY: lighthouse-mobile   (depends on lighthouse-setup, remove LHCI_BUILD_CMD)
│
├── docker-compose.yml                    ← ADD Mockoon service
│   └── ADD: mockoon service             (moved from docker-compose.test.yml,
│                                         with existing healthcheck, port mapping,
│                                         network, restart policy)
│
├── docker-compose.test.yml               ← REMOVE Mockoon service
│   └── REMOVE: mockoon service          (now lives in docker-compose.yml)
│
├── .github/workflows/
│   ├── ci.yml                           ← NEW — single source of truth workflow
│   │   └── Calls `make ci`; triggers on PR to main
│   ├── static-testing.yml               ← RETIRE (lint covered by ci.yml)
│   └── unit-testing.yml                 ← RETIRE (unit tests covered by ci.yml)
│
├── README.md                            ← DOCUMENTATION UPDATES
│   ├── Update: make start description  (both services, health checks, ports)
│   ├── Add: make ci section            (usage, what it runs, relationship to CI)
│   └── Add: GNU Make 4.0+ prerequisite (macOS: brew install make)
│
└── CONTRIBUTING.md                      ← NEW
    ├── Add: GNU Make 4.0+ requirement
    ├── Add: make ci as pre-push workflow
    └── Add: "Make targets as contracts" principle
```

---

### Architectural Boundaries

**Compose File Boundaries (post-change):**

```text
docker-compose.yml            → dev services (active development)
  services: dev, mockoon

docker-compose.test.yml       → test execution services
  services: prod, playwright, k6

docker-compose.memory-leak.yml → isolated memory leak testing
  services: memory-leak

common-healthchecks.yml       → shared healthcheck definitions
  applied via -f overlay alongside docker-compose.test.yml
```

**GitHub Actions Workflow Boundaries (post-change):**

```text
ci.yml                  → lint + unit tests (make ci) — PR gate     [NEW]
e2e-testing.yml         → E2E tests (make test-e2e)                 [unchanged]
visual-testing.yml      → visual regression (make test-visual)      [unchanged]
performance-testing.yml → Lighthouse (make lighthouse-*)            [unchanged]
unit-testing.yml        → RETIRED (covered by ci.yml)
static-testing.yml      → RETIRED (covered by ci.yml)
```

**`make ci` Scope Boundary:**

```text
IN SCOPE (MVP):   lint-eslint, lint-tsc, lint-md,
                  ci-test-unit-client, ci-test-unit-server

OUT OF SCOPE:     test-integration, test-e2e, test-visual,
                  test-memory-leak, test-load, lighthouse-*
```

---

### Integration Points

**`ci-setup` vs `make start`:** `ci-setup` re-implements the environment bring-up directly (rather
than calling `make start`) to support the `CI=1` conditional — `--build` in CI, `--no-recreate`
locally. Both achieve the same result; `ci-setup` avoids unnecessary rebuilds on repeated local
`make ci` runs.

**`start-prod` → `lighthouse-setup` integration:** `lighthouse-setup` depends on `start-prod` as a
Make prerequisite. `start-prod` now uses both compose files to bring up `prod` and `mockoon`. If
`start-prod`'s service list changes, `lighthouse-setup` inherits the change automatically.

**GitHub Actions → `make ci` integration:** The new `ci.yml` workflow is intentionally minimal:

```yaml
- name: Run CI checks
  run: make ci
  env:
    CI: 1
```

No check list in the YAML. The Makefile is the single source of truth.

**Top-level `export` and the `CI=1` conditional:** The Makefile has `export` on line 9. GNU Make
reads environment variables automatically — no `export` directive is needed for `ifeq ($(CI),1)` to
see the `CI` variable set in the calling shell or GitHub Actions environment. What `export` does is
cause Make variables (including those loaded from the `-include`d `.env*` files) to be passed down
as environment variables to recipe subprocesses. Removing `export` would not break the conditional
itself, but it would stop Make variables from being visible to the shell commands inside recipe
bodies.

## Architecture Validation Results

### Coherence Validation ✅

All five architectural decisions are mutually compatible. The Compose topology change cascades
correctly into `start-prod` and `start`; `lighthouse-setup` uses Make's dependency graph for
deduplication without sentinel logic; `wait-for-mockoon` uses `$(MOCKOON_PORT)` consistently; the
`CI=1` conditional is the single environment-branching point in the entire architecture.

**Coherence fix applied — `start-prod` service list:** Updated to include `playwright` (required for
`docker compose exec playwright` by test targets):

```makefile
start-prod: create-network
    $(DOCKER_COMPOSE) $(DOCKER_COMPOSE_DEV_FILE) $(DOCKER_COMPOSE_TEST_FILE) \
        $(COMMON_HEALTHCHECKS_FILE) up -d --no-recreate prod mockoon playwright
    make wait-for-prod-health
```

**Coherence fix applied — `ci-setup` missing `create-network`:** `ci-setup` must depend on
`create-network`, consistent with `start` and `start-prod`. On a fresh GitHub Actions runner the
external Docker network does not exist:

```makefile
ci-setup: create-network
ifeq ($(CI),1)
    $(DOCKER_COMPOSE) $(DOCKER_COMPOSE_DEV_FILE) up -d --build dev mockoon
else
    $(DOCKER_COMPOSE) $(DOCKER_COMPOSE_DEV_FILE) up -d --no-recreate dev mockoon
endif
    make wait-for-dev
    make wait-for-mockoon
```

### Requirements Coverage Validation ✅

All 22 functional requirements and 13 non-functional requirements are architecturally supported. See
Decision Impact Analysis and File Change Map for requirement-to-implementation traceability.

### Implementation Readiness Validation ✅

All critical decisions include exact Makefile recipes. Variable names, flag values, and service
names are fully specified. The phased execution model includes working code examples. Anti-patterns
table provides explicit no-go list for implementation agents.

### Gap Analysis Results

**Critical Gaps:** None.

**Minor Gaps (non-blocking, addressed in validation):**

1. **`ci-setup` network prerequisite** — fixed above; `create-network` added as prerequisite.
2. **`start-prod` service list** — fixed above; `playwright` added.
3. **Branch protection rules** — blocking production migration prerequisite. Before retiring
   `static-testing.yml` and `unit-testing.yml`, complete this mandatory pre-flight sequence:
   1. Deploy `ci.yml` and confirm the workflow emits the `ci` job.
   2. Update GitHub branch protection required checks from old job names to the new job name:
      `static` → `ci` and `unit` → `ci`.
   3. Verify branch protection settings show `ci` as the required check and no longer require
      `static` or `unit`.
   4. Audit external integrations that may key off `static` or `unit`, including Codecov,
      Dependabot, status-check configurations, and release automation; update references to `ci`
      or document why no update is required.
   5. Run an implementable verification step before deletion, for example
      `scripts/verify-branch-protection-ci-check.sh`, that fails unless branch protection required
      checks include `ci` and no longer include `static` or `unit`.
   6. Only after successful verification, remove or retire `static-testing.yml` and
      `unit-testing.yml`.
   Deleting the workflows before this checklist passes will either block merges or silently remove
   PR protection.
4. **External integration audit** — covered by the mandatory branch-protection pre-flight sequence
   above; do not treat it as optional cleanup after workflow retirement.
5. **`ci.yml` full YAML** — skeleton shown in architecture; implementation agent completes trigger,
   runner, Node setup, following the pattern of existing workflows.
6. **`CONTRIBUTING.md` content** — described but not fully detailed; implementation agent follows
   the documented structure.

### Architecture Completeness Checklist

#### Requirements Analysis

- [x] Project context thoroughly analyzed (22 FRs, 13 NFRs across 5 categories)
- [x] Scale and complexity assessed (Low — brownfield infrastructure tooling)
- [x] Technical constraints identified (GNU Make 4.0+, Docker Compose topology, DIND)
- [x] Cross-cutting concerns mapped (6 concerns, all addressed)

#### Architectural Decisions

- [x] Docker Compose topology decided (Option A — Mockoon to `docker-compose.yml`)
- [x] `make ci` phase structure decided (3-phase, `ci-` prefix sub-targets)
- [x] Chromium deduplication decided (`lighthouse-setup` prerequisite)
- [x] GNU Make version strategy decided (hard prerequisite, 4.0+)
- [x] Mockoon health check decided (TCP via `wait-on`, `$(MOCKOON_PORT)`)

#### Implementation Patterns

- [x] Makefile target naming conventions established
- [x] Variable naming conventions established
- [x] Docker Compose file boundaries defined
- [x] Health check target structure defined
- [x] CI/local conditional pattern defined
- [x] Anti-patterns table documented

#### Project Structure

- [x] Complete file change map defined (6 files: ADD, MODIFY, RETIRE)
- [x] Compose file boundaries post-change documented
- [x] GitHub Actions workflow retirement plan defined (with branch protection note)
- [x] `make ci` scope boundary explicitly stated
- [x] Integration points documented

### Architecture Readiness Assessment

**Overall Status:** READY FOR IMPLEMENTATION

**Confidence Level:** High — well-understood problem space, precise recipes documented, blast-radius
inventory complete, two validation-round fixes applied, no novel technology.

**Key Strengths:**

- Every architectural decision includes a working Makefile recipe
- Race condition risk fully eliminated by phased execution design
- Blast-radius inventory prevents regression in dependent targets
- `playwright` service inclusion and `create-network` prerequisite verified
- "Make targets as contracts" principle documented for future maintainability
- Branch protection and integration audit steps explicitly called out

**Areas for Future Enhancement (Post-MVP):**

- `ci-sequential` fallback for contributors with Make < 4.0
- `CI_TARGETS` env var for running subsets locally
- Unified health-check utility across all `wait-for-*` targets
- `make ci` per-check timing output
- `make ci-full` including performance and visual regression tests

### Implementation Handoff

**First Implementation Priority:** Docker Compose topology change (move Mockoon to
`docker-compose.yml` + update `start-prod` with corrected service list) — highest blast radius,
gates all dependent work. Implement and verify all blast-radius targets pass before proceeding to
independent changes.

**AI Agent Guidelines:**

- Follow all architectural decisions exactly as documented — especially the `playwright` service in
  `start-prod`, `create-network` in `ci-setup`, and the `CI=1` conditional
- Do not remove the top-level `export` directive from the Makefile — it propagates Make variables
  (including those loaded from `.env*` files) into recipe subprocesses; GNU Make reads `CI` from the
  environment automatically so `ifeq ($(CI),1)` works regardless, but recipe commands still need
  `export` to see those variables
- Update GitHub branch protection rules before retiring old workflows
- Audit external tool job-name references before retiring `static-testing.yml` and
  `unit-testing.yml`
- Use the Anti-Patterns table as a checklist before submitting implementation
- Verify all blast-radius targets pass after each change set
- Refer to the Implementation Sequence in the Decision Impact Analysis for commit ordering
