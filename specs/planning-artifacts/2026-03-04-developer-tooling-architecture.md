---
stepsCompleted: [step-01-init, step-02-context, step-03-starter, step-04-decisions, step-05-patterns, step-06-structure, step-07-validation, step-08-complete]
lastStep: 8
status: 'complete'
completedAt: '2026-03-05'
inputDocuments: [specs/planning-artifacts/2026-03-04-developer-tooling-prd.md]
workflowType: 'architecture'
project_name: 'crm'
user_name: 'Dima'
date: '2026-03-04'
---

# Architecture Decision Document

_This document builds collaboratively through step-by-step discovery. Sections are appended as we work through each architectural decision together._

## Project Context Analysis

### Requirements Overview

**Functional Requirements:**

23 FRs across 4 capability areas:
- **Development environment startup (FR1–FR4):** `make start` must orchestrate `dev` + `mockoon`
  services together, polling `http://localhost:8080/api/health` (Mockoon) and
  `http://localhost:3000/` (dev server) before exiting. Exit with non-zero code on timeout.
- **CI execution (FR5–FR13):** `make ci` runs in three ordered phases — preflight (sequential),
  Wave 1 parallel (lint/unit/tsc), prod build gate, Wave 2 parallel (E2E/visual/performance).
  Startup targets use `docker compose up` and follow-on command targets use
  `docker compose exec`/`docker compose run --rm`. `--output-sync=target` provides clean
  per-target output with attributable failures within each parallel wave.
- **Chromium management (FR14–FR17):** `ensure-chromium` is idempotent — no-op when already
  present. Running the full Lighthouse sequence twice must not trigger a second install.
- **Documentation (FR18–FR20):** All new targets appear correctly in `make help` output.

**Non-Functional Requirements:**

- **Performance:** `make start` completes within 60 seconds (NFR1); `make ci` wall-clock time
  measurably less than sequential execution (NFR2)
- **Reliability:** `make start` idempotent on repeated invocations — starting already-running
  services must not error (NFR3); CI parallelism must not introduce flakiness beyond underlying
  tests (NFR4). NFR4 compliance depends on polling retry interval (not just total timeout) —
  too-tight intervals cause race conditions between health-check attempts and service startup.
- **Maintainability:** All targets use `## comment` convention for `make help` (NFR5); emoji
  output style `🚀`/`✅`/`❌` matching `user-service` conventions (NFR6)

**Scale & Complexity:**

This is a **brownfield tooling change** — Makefile and Docker Compose configuration only.
No application code, no new services, no infrastructure changes.

- Primary domain: developer tooling / build infrastructure
- Implementation complexity: **low** (3 components: `start-orchestrator`, `ci-phase-engine`,
  `chromium-guard`)
- Impact audit scope: **medium** — breaking change audit spans CI YAML, scripts, and docs
  across the repo, not just the Makefile

### Technical Constraints & Dependencies

- **GNU Make** is the execution engine — solution must work within Make's capabilities
- **Docker Compose** for service orchestration — health checks via shell polling (not Docker
  healthcheck)
- **Shell tooling**: Use only tools already present in existing Makefile targets — no new
  shell dependencies. If `curl` is already used, use `curl`; do not introduce `wget` or
  other alternatives.
- **`user-service` Makefile** is the reference implementation — naming, emoji style, and
  parallel patterns must match
- **C1 constraint**: No breaking changes to existing targets except `make start` (intentional
  non-blocking → blocking change with required caller audit and migration note)
- **No new infrastructure**: Solution uses only existing tools (Make, bash, `curl` for HTTP checks)

### Cross-Cutting Concerns Identified

- **`JOBS` variable**: Controls parallelism in both Wave 1 and Wave 2 — single definition,
  used in both places
- **Health-check polling pattern**: Same pattern (poll until HTTP 200 or timeout) used in
  `start-orchestrator` (Mockoon + port 3000) and `ci-phase-engine` (port 3001) — should be
  a shared make function or shell snippet; retry interval is a key reliability variable
- **Idempotency contract**: Both `start-orchestrator` and `chromium-guard` must tolerate
  repeated invocations — this is an explicit requirement, not a nice-to-have
- **Breaking change audit scope**: `make start` behavior changes from non-blocking to blocking.
  Impact extends beyond the Makefile to CI YAML, scripts, and docs. **Required deliverable:**
  grep `.github/`, `Makefile`, `*.sh`, and `*.md` for `make start` invocations; each found
  instance must be confirmed safe (already tolerates blocking) or updated. Done = zero
  unreviewed callers.

## Starter Template Evaluation

### Primary Technology Domain

Developer tooling / build infrastructure — GNU Make + Docker Compose.
Brownfield change to an existing project. No new project initialization required.

### Starter Options Considered

No external starter templates apply. The implementation foundation is:

1. **Existing Makefile** — current target definitions, `curl`-based polling (confirmed in
   `wait-for-dev`), and `docker compose exec` patterns already in use
2. **`user-service` Makefile** — confirmed reference for naming, emoji style, `ci-preflight`,
   and parallel group patterns
3. **Existing `docker-compose.yml`** — current service definitions for `dev` and test
   containers; `mockoon` service to be added

### Selected Foundation: Existing Makefile + user-service Patterns

**Rationale:** The project already has a working Makefile with established conventions.
The `user-service` Makefile provides proven patterns for the CI orchestration needed.

**What already exists (confirmed by audit):**

- `ensure-chromium` — already implemented and idempotent (`[ -x "$(CHROMIUM_BIN_PATH)" ]` guard);
  FR14–FR17 are **already satisfied** by existing code; no changes required
- `wait-for-dev` — polling pattern using `curl` + `sleep` with configurable
  `WAIT_FOR_DEV_MAX_TRIES ?= 150` / `WAIT_FOR_DEV_SLEEP ?= 2`; reuse pattern for
  `wait-for-mockoon` with NFR1-aligned defaults (see below)
- `curl` — already the HTTP tool of choice; no alternative to be introduced
- `make start` — currently single-service (`$(DEV_CMD)`), non-blocking; Mockoon + blocking
  readiness is the full scope of `start-orchestrator`

**What is greenfield (confirmed absent):**

- `--output-sync=target` — not used anywhere in current Makefile
- `JOBS` variable — not defined
- `make ci`, `make ci-wave-1`, `make ci-wave-2`, `make ci-build-prod` — none exist
- Mockoon service in `docker-compose.yml` — not present

**Execution Model:** Startup/orchestration targets use `docker compose up` to create and start
containers; follow-on targets use `docker compose exec` (already-running services) or
`docker compose run --rm` (clean one-off container execution). No direct local execution.
CI runners mirror the same pattern.

**Variable conventions:**
- `JOBS ?= 2` (local default)
- `?=` behavior is preserved: variable defaults are set only when unset. Keep global defaults
  `WAIT_FOR_DEV_MAX_TRIES ?= 150` / `WAIT_FOR_DEV_SLEEP ?= 2` for standalone `wait-for-dev`.
- Add Mockoon defaults adjacent to dev defaults:
  `WAIT_FOR_MOCKOON_MAX_TRIES ?= 30` / `WAIT_FOR_MOCKOON_SLEEP ?= 2`.
- Polling for `make start` runs **concurrently** and enforces NFR1 via explicit command-line
  overrides:
  `$(MAKE) wait-for-dev WAIT_FOR_DEV_MAX_TRIES=30 WAIT_FOR_DEV_SLEEP=2`
  `$(MAKE) wait-for-mockoon WAIT_FOR_MOCKOON_MAX_TRIES=30 WAIT_FOR_MOCKOON_SLEEP=2`
  This keeps global defaults intact while applying 30-try startup behavior only in `make start`.

**Shell tooling:** `curl` only — already present, no new dependencies.

**Note:** No project initialization story needed. Implementation begins directly
with Makefile and Docker Compose modifications. FR14–FR17 (Chromium deduplication)
are already implemented — verify and close, do not rewrite.

## Core Architectural Decisions

### Decision Priority Analysis

**Critical Decisions (Block Implementation):**
- Health-check polling implementation pattern (shared macro)
- Concurrent startup mechanism for `make start`
- Mockoon service location in docker-compose

**Deferred Decisions (Post-MVP):**
- Configurable readiness timeout/retry via Makefile variables (Post-MVP per PRD)

### Make Execution Patterns

**D1 — Health-check polling: Shared `define` macro**

- Decision: Single `WAIT_FOR_HTTP` macro parameterized by service name, URL,
  max tries, and sleep interval
- Rationale: `wait-for-dev` and `wait-for-mockoon` share identical logic;
  a shared macro eliminates duplication and ensures both use the same retry
  behaviour. Make `define` macros are the idiomatic reuse mechanism.
- Affects: `wait-for-dev` (refactored to use macro), `wait-for-mockoon` (new)

**D2 — Concurrent startup: PID-capture background subshells**

- Decision: `make start` launches `wait-for-dev` and `wait-for-mockoon` as
  concurrent background processes using PID capture, then checks each
  individually:
  ```makefile
  start: create-network
      $(DOCKER_COMPOSE) $(DOCKER_COMPOSE_DEV_FILE) up -d --build dev mockoon
      @( $(MAKE) wait-for-dev WAIT_FOR_DEV_MAX_TRIES=30 WAIT_FOR_DEV_SLEEP=2 ) & PID1=$$!; \
       ( $(MAKE) wait-for-mockoon WAIT_FOR_MOCKOON_MAX_TRIES=30 WAIT_FOR_MOCKOON_SLEEP=2 ) & PID2=$$!; \
       wait $$PID1 || EXIT=1; \
       wait $$PID2 || EXIT=1; \
       exit $${EXIT:-0}
  ```
- Rationale: Plain `wait` (no args) returns only the last job's exit code —
  a failing `wait-for-dev` would be silently swallowed. PID capture ensures
  both failure paths are checked independently. Meets NFR1 (60s) without
  sequential 300s+ worst case.
- Affects: `make start` recipe

### Service Orchestration

**D4 — Mockoon service: port to `docker-compose.yml`**

- Decision: Copy mockoon service definition from `docker-compose.test.yml` into
  `docker-compose.yml` so `make start` (which uses `DOCKER_COMPOSE_DEV_FILE =
  -f docker-compose.yml`) can start it alongside `dev`
- Rationale: Existing mockoon definition in `docker-compose.test.yml` is the
  authoritative template. Porting preserves all configuration (port, network).
  Docker healthcheck uses `wget` (inside container) — correct as-is. Makefile
  polling uses `curl` (host-side) — separate context, no conflict.
- Health endpoint note (resolved): Mockoon CLI does not expose a separate built-in
  readiness path. The loaded OpenAPI spec (`user-service` `v2.7.1`) explicitly defines
  `GET /api/health` (success response `204`). `wait-for-mockoon` must poll
  `http://$(WEBSITE_DOMAIN):$(MOCKOON_PORT)/api/health` via `WAIT_FOR_HTTP`
  (using `curl -fsS`, so any 2xx/3xx is success). Do not poll `/api/users`.
- Affects: `docker-compose.yml`, `make start`

### Decision Impact Analysis

**Implementation Sequence:**
1. Port mockoon to `docker-compose.yml`
2. Implement `WAIT_FOR_HTTP` macro; refactor `wait-for-dev` to use it
3. Add `wait-for-mockoon` using the macro (`http://$(WEBSITE_DOMAIN):$(MOCKOON_PORT)/api/health`)
4. Update `make start` with PID-capture concurrent polling
5. Implement `make ci` phase structure (`ci-preflight`, `ci-wave-1`,
   `ci-build-prod`, `ci-wave-2`)
6. Verify `ensure-chromium` (FR14–FR17 already satisfied — confirm, don't rewrite)
7. Update `make help` documentation for all new targets
8. Breaking change audit: grep callers of `make start`

**Cross-Component Dependencies:**
- `WAIT_FOR_HTTP` macro must be defined before any `wait-for-*` targets
- `mockoon` in `docker-compose.yml` must exist before `make start` is updated
- `ci-wave-2` depends on `ci-build-prod` completing successfully — enforced by
  Make prerequisite ordering, not shell logic

## Implementation Patterns & Consistency Rules

### Critical Conflict Points

6 areas where an implementing agent could make inconsistent choices:
target naming, variable naming, recipe shell style, output messaging,
`.PHONY` declaration, and Docker Compose invocation.

### Naming Patterns

**Make Target Naming:**
- All new targets: `kebab-case` — consistent with existing targets
  (`wait-for-dev`, `start-prod`, `test-unit-all`)
- CI phase targets follow `ci-<phase>` prefix:
  `ci-preflight`, `ci-wave-1`, `ci-build-prod`, `ci-wave-2`
- Wait targets follow `wait-for-<service>` prefix:
  `wait-for-dev`, `wait-for-mockoon`
- Anti-pattern: `ciWave1`, `CI_WAVE_1`, `waitForDev`

**Make Variable Naming:**
- All variables: `SCREAMING_SNAKE_CASE` — consistent with existing
  (`WAIT_FOR_DEV_MAX_TRIES`, `DOCKER_COMPOSE_DEV_FILE`, `JOBS`)
- Boolean flags: `?= 0` / `?= 1` — not `true`/`false`
- Anti-pattern: `jobs`, `waitForDevMaxTries`

### Structure Patterns

**Makefile Section Order:**
New targets belong in the section matching their concern:
- Service orchestration targets (`wait-for-*`, `start`) — near existing `start`
- CI targets (`ci-*`) — new section after test targets
- Variable definitions — near top with existing variable blocks

**`.PHONY` Declaration:**
Every new target must be declared `.PHONY` — none of these targets produce files.
Omitting `.PHONY` causes Make to silently skip targets when a file of the same
name exists. Declare together at the top of the relevant section, not inline.

### Recipe Shell Patterns

**Shell block rule:**
Multi-step recipes that share state (variables, exit codes) MUST use a single
shell block with `\` continuation. Do NOT split into separate recipe lines.
- Correct: `@FAILED=0; \` ... `exit $$FAILED`
- Wrong: separate lines — each spawns a new subshell, variables don't persist

**Variable expansion:**
- Make variables: `$(VAR)` — always with parentheses
- Shell variables inside recipes: `$$VAR` — double `$` to escape Make expansion
- Shell arithmetic: `$$((i+1))` not `$((i+1))`

**`@` prefix:**
Use `@` to suppress echo on all recipe lines that produce their own output
(polling loops, echo statements). Omit `@` only when the command itself
is the meaningful output (rare).

**Shell interpreter:**
Use `/bin/sh`-compatible syntax only — no bash-specific features (`[[`, `(( ))`,
`local`, arrays). All existing Makefile recipes use `sh`.

### Output Messaging Patterns

**Emoji conventions (matching `user-service`):**
- Starting / in-progress: `🚀`
- Success: `✅`
- Failure: `❌`
- Wait/polling dots: `printf "."`

**Message format:**
```
🚀 Starting <service>...
✅ <Service> is up and running!
❌ Timed out waiting for <service>
❌ FAILED: <target-name>
```

No free-form messages. Match the exact pattern from `wait-for-dev` for
consistency.

### Docker Compose Invocation Pattern

**Always use the defined variables — never inline:**
- Correct: `$(DOCKER_COMPOSE) $(DOCKER_COMPOSE_DEV_FILE) up -d mockoon`
- Wrong: `docker compose -f docker-compose.yml up -d mockoon`

This ensures compose file overrides work correctly and is consistent with
every existing target.

### Enforcement Guidelines

**All implementing agents MUST:**
- Declare every new target in `.PHONY`
- Use `$(DOCKER_COMPOSE) $(DOCKER_COMPOSE_DEV_FILE)` for all dev service commands
- Use `\` continuation for any recipe that shares shell state
- Use `$$VAR` for shell variables (not `$VAR`) inside recipes
- Follow emoji output style for all user-visible messages
- Add `## descriptive comment` to every new public target for `make help`

**Anti-patterns to avoid:**
- Splitting a stateful recipe across multiple lines
- Using `docker compose` directly instead of `$(DOCKER_COMPOSE)`
- Hardcoding compose file names
- Using `wait` without PID capture for concurrent processes
- Polling an API endpoint for health (use a dedicated health path)

## Project Structure & Boundaries

### Files Changed

This PR modifies exactly two files:

```
crm/
├── Makefile                    ← primary changes (macro, new targets, new section)
└── docker-compose.yml          ← add mockoon service block
```

No new files. No new directories. All three architectural components
(`start-orchestrator`, `ci-phase-engine`, `chromium-guard`) live in `Makefile`.

### Makefile Structure Map

**New additions placed relative to existing sections:**

```
Makefile
├── [existing] Variable definitions (top block)
│   ├── WAIT_FOR_DEV_MAX_TRIES ?= 150         ← already exists
│   ├── WAIT_FOR_DEV_SLEEP ?= 2               ← already exists
│   ├── WAIT_FOR_MOCKOON_MAX_TRIES ?= 30      ← NEW — add adjacent
│   └── WAIT_FOR_MOCKOON_SLEEP ?= 2           ← NEW — add adjacent
│
├── [new] WAIT_FOR_HTTP macro (define block)
│   └── define WAIT_FOR_HTTP ... endef        ← NEW — add before wait-for-dev
│
├── [existing] start target (line ~128)
│   ├── start: create-network                  ← MODIFIED — add mockoon + concurrent polling
│   ├── wait-for-dev: ...                      ← MODIFIED — refactor in place to use WAIT_FOR_HTTP macro (do not delete and recreate)
│   └── wait-for-mockoon: ...                  ← NEW — add immediately after wait-for-dev
│
├── [existing] Test targets section
│   └── (unchanged)
│
├── [new] CI targets section                   ← NEW SECTION — after test targets
│   ├── .PHONY ci ci-preflight ci-wave-1 ci-build-prod ci-wave-2
│   ├── JOBS ?= 2
│   ├── ci: ci-preflight ci-wave-1 ci-build-prod ci-wave-2
│   ├── ci-preflight:
│   ├── ci-wave-1:
│   ├── ci-build-prod:
│   └── ci-wave-2:
│
└── [existing] ensure-chromium (line ~160)
    └── (verify only — no changes expected)
```

### docker-compose.yml Structure Map

```
docker-compose.yml
└── services:
    ├── dev: (existing — unchanged)
    └── mockoon:                               ← NEW — ported from docker-compose.test.yml
        ├── build: (Mockoon.Dockerfile)
        ├── ports: ["${MOCKOON_PORT:-8080}:${MOCKOON_PORT:-8080}"]
        ├── restart: unless-stopped
        └── networks: [crm-network / website-network]
```

**Do NOT copy the `healthcheck` block** from `docker-compose.test.yml`. It is only
needed there for `depends_on: condition: service_healthy` used by E2E test containers.
In `docker-compose.yml`, readiness is handled by `wait-for-mockoon` in the Makefile —
a Docker healthcheck is redundant and adds startup delay.

### Requirements to Structure Mapping

| FR | Component | Location |
|---|---|---|
| FR1 — single `make start` | `start-orchestrator` | `Makefile`: `start` target |
| FR2 — wait for dev | `start-orchestrator` | `Makefile`: `wait-for-dev` (refactor in place) |
| FR3 — wait for Mockoon | `start-orchestrator` | `Makefile`: `wait-for-mockoon` (new) |
| FR4 — timeout exit | `start-orchestrator` | `WAIT_FOR_HTTP` macro |
| FR5 — single `make ci` | `ci-phase-engine` | `Makefile`: `ci` target |
| FR6 — preflight | `ci-phase-engine` | `Makefile`: `ci-preflight` |
| FR7 — Wave 1 parallel | `ci-phase-engine` | `Makefile`: `ci-wave-1` |
| FR8 — prod build gate | `ci-phase-engine` | `Makefile`: `ci-build-prod` |
| FR9 — Wave 2 parallel | `ci-phase-engine` | `Makefile`: `ci-wave-2` |
| FR10 — skip Wave 2 on failure | `ci-phase-engine` | Make prerequisite chain (automatic) |
| FR11 — non-zero exit on failure | `ci-phase-engine` | Make prerequisite chain (automatic) |
| FR12 — attributable failure output | `ci-phase-engine` | `--output-sync=target` on `ci-wave-1`, `ci-wave-2` |
| FR13 — `JOBS` variable | `ci-phase-engine` | `Makefile`: `JOBS ?= 2` |
| FR14–FR17 — Chromium guard | `chromium-guard` | `Makefile`: `ensure-chromium` (verify only) |
| FR18–FR20 — `make help` docs | All | `## comment` on each new target |

### Integration Points

**`make start` → docker-compose.yml:**
`start` target brings up `dev` + `mockoon` via `$(DOCKER_COMPOSE) $(DOCKER_COMPOSE_DEV_FILE) up -d`.
Mockoon must be defined in `docker-compose.yml` for this to work.

**`WAIT_FOR_HTTP` macro → `wait-for-dev` / `wait-for-mockoon`:**
Both wait targets call the same macro with different parameters. Macro defined once,
referenced twice. Any change to polling logic touches one place only.

**`make ci` → existing test targets:**
`ci-wave-1` and `ci-wave-2` call existing targets (`make lint`, `make test-unit-all`,
`make test-e2e`, etc.) — they are orchestrators, not reimplementations. Existing
targets remain unchanged (C1 constraint satisfied).

**`ci-build-prod` → `make start-prod`:**
`ci-build-prod` calls `make start-prod` + polls for port 3001. `start-prod` is
an existing target — no changes needed.

## Architecture Validation Results

### Coherence Validation ✅

**Decision Compatibility:** GNU Make + Docker Compose V2 + POSIX sh — no version
conflicts. All tools already present in the project.

**Pattern Consistency:** Naming conventions (`kebab-case` targets, `SCREAMING_SNAKE_CASE`
variables), Docker Compose invocation via variables, and emoji output style are
consistently applied across all new components.

**Structure Alignment:** Two-file change scope (`Makefile`, `docker-compose.yml`)
is clean and well-bounded. All new Make targets placed in appropriate existing or
new sections. No structural conflicts.

### Requirements Coverage Validation ✅

**Functional Requirements:** All 20 FRs covered — see FR-to-structure mapping in
Project Structure section. No gaps.

**Non-Functional Requirements:**

| NFR | Addressed By |
|---|---|
| NFR1 — `make start` ≤ 60s | Concurrent PID-capture polling; 30-try × 2s = 60s max per service |
| NFR2 — `make ci` faster than sequential | `-j$(JOBS) --output-sync=target` on both waves |
| NFR3 — idempotent `make start` | `docker compose up -d` is idempotent by design |
| NFR4 — no new CI flakiness | `--output-sync` isolates output; health endpoints confirm readiness |
| NFR5 — `make help` coverage | `## comment` required on all new public targets |
| NFR6 — emoji output style | Enforced in Implementation Patterns section |

### Gap Analysis & Resolutions

**Gap 1 (Resolved) — `ci-preflight` format gate:**

`make format` uses `prettier --write` — always exits 0, not usable as a CI gate.

**Resolution (best practice):** `ci-preflight` runs format check only via a
dedicated check variable. Lint belongs in `ci-wave-1`, not preflight — running
it in both would double-execute lint in `make ci`.

```makefile
PRETTIER_CHECK_CMD = $(BUNX) prettier "**/*.{js,jsx,ts,tsx,mts,json,css,scss,md}" \
  --check --ignore-path .prettierignore

ci-preflight: ## Run format check (sequential gate before parallel waves)
	@echo "🚀 Running preflight checks..."
	$(DOCKER_COMPOSE) $(DOCKER_COMPOSE_DEV_FILE) run --rm dev $(PRETTIER_CHECK_CMD)
	@echo "✅ Preflight passed"
```

`make format` (write mode) is preserved unchanged — C1 satisfied.

**Pinned wave target lists:**

```
ci-preflight:  PRETTIER_CHECK_CMD only (format check gate)
ci-wave-1:     lint-eslint  lint-tsc  lint-md  test-unit-all  (parallel -j$(JOBS))
ci-build-prod: start-prod + wait for port 3001
ci-wave-2:     test-e2e  test-visual  test-memory-leak  lighthouse-desktop  lighthouse-mobile  (parallel -j$(JOBS))
```

**Gap 2 (Resolved) — Wave 2 targets re-invoke `start-prod`:**

`test-e2e`, `test-visual`, and `test-memory-leak` each declare `start-prod` as a
Make prerequisite. When called from `ci-wave-2`, Make re-runs `start-prod`
(phony targets always re-run). However, `start-prod` uses `docker compose up -d`
(idempotent — container already running) followed by a health wait. With the
container already up, `curl` succeeds on the first attempt — health wait returns
immediately. Re-run overhead is negligible. No action needed.

**Gap 3 (Resolved) — Mockoon health endpoint URL:**

Verification confirmed the Mockoon runtime source (`user-service` OpenAPI spec `v2.7.1`)
contains `GET /api/health` and no separate built-in Mockoon readiness route.

**Resolution:** `wait-for-mockoon` polls
`http://$(WEBSITE_DOMAIN):$(MOCKOON_PORT)/api/health` via:

```makefile
$(call WAIT_FOR_HTTP,Mockoon,http://$(WEBSITE_DOMAIN):$(MOCKOON_PORT)/api/health,$(WAIT_FOR_MOCKOON_MAX_TRIES),$(WAIT_FOR_MOCKOON_SLEEP))
```

**Acceptance criteria:**
- `wait-for-mockoon` uses `/api/health` (not `/api/users`)
- `make start` invokes both wait targets with explicit 30-try overrides for NFR1
- `wait-for-mockoon` fails fast with non-zero exit if `/api/health` is not reachable within timeout

### Architecture Completeness Checklist

- [x] Project context thoroughly analyzed and validated
- [x] Scale and complexity correctly assessed (low implementation / medium audit)
- [x] Technical constraints identified (`curl`, POSIX sh, Docker Compose vars)
- [x] Cross-cutting concerns mapped (`JOBS`, polling pattern, idempotency, break audit)
- [x] Critical decisions documented (D1–D4 with rationale)
- [x] Implementation patterns comprehensive (naming, structure, shell, output, compose)
- [x] Conflict points identified and resolved (6 potential conflict areas)
- [x] Complete file structure defined (2 files, exact placement)
- [x] FR-to-structure mapping complete (all 20 FRs traced)
- [x] Integration points defined (macro, compose, ci chain, start-prod)
- [x] Validation gaps resolved (3 gaps — all resolved)
- [x] All wave target lists pinned (ci-preflight, ci-wave-1, ci-build-prod, ci-wave-2)

### Architecture Readiness Assessment

**Overall Status: READY FOR IMPLEMENTATION**

**Confidence Level: High**

**Key Strengths:**
- Brownfield scope tightly bounded — 2 files, 3 components, no new infrastructure
- All decisions grounded in existing codebase audit (confirmed tools, patterns, existing implementations)
- FR14–FR17 already satisfied — scope reduced before implementation begins
- PID-capture concurrent polling and `--output-sync` are proven patterns
- All wave target lists explicitly pinned — no implementation guesswork

**Areas for Future Enhancement (Post-MVP per PRD):**
- Configurable readiness timeout/retry via Makefile variables
- `make ci` matrix reporting (structured failure summary)

### Implementation Handoff

**First implementation step:**
Port mockoon service from `docker-compose.test.yml` to `docker-compose.yml`
(without healthcheck block) — all other changes depend on this.

**Full sequence:** See Implementation Sequence in Core Architectural Decisions.

**AI Agent Guidelines:**
- Follow Implementation Patterns section for all Make recipe authoring
- Use `$(DOCKER_COMPOSE) $(DOCKER_COMPOSE_DEV_FILE)` — never inline compose invocation
- Refactor `wait-for-dev` in place — do not delete and recreate
- Verify `ensure-chromium` before marking FR14–FR17 complete — do not rewrite
- Use `http://$(WEBSITE_DOMAIN):$(MOCKOON_PORT)/api/health` for `wait-for-mockoon` (do not use `/api/users`)
- Preserve global `WAIT_FOR_DEV_MAX_TRIES ?= 150`; apply 30-try startup behavior via `make start` command-line overrides
- `ci-preflight` runs format check only — lint is in `ci-wave-1`
- Breaking change audit (grep `.github/`, `*.sh`, `*.md` for `make start`) is
  a required deliverable of the PR
