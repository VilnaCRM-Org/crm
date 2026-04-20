---
stepsCompleted: [1, 2, 3, 4, 5, 6, 7, 8]
lastStep: 8
status: 'complete'
completedAt: '2026-04-16'
inputDocuments:
  - "specs/planning-artifacts/prd-makefile-playwright-targets-2026-04-16.md"
workflowType: 'architecture'
project_name: 'crm'
user_name: 'platform-team'
date: '2026-04-16'
---

# Architecture Decision Document

_This document builds collaboratively through step-by-step discovery. Sections are appended as we
work through each architectural decision together._

## Project Context Analysis

### Requirements Overview

**Functional Requirements:**
The PRD defines 29 functional requirements across nine capability areas: dev-mode Playwright
execution, file/glob targeting, interactive debug support, browser provisioning, visual baseline
management, Playwright configuration branching, Docker Compose network topology, backwards
compatibility/discoverability, and operator feedback. Architecturally, this is a repository workflow
initiative centered on the Makefile as the public API, Docker Compose as the runtime boundary, and
Playwright configuration as the single source of test-run behavior. The implementation must provide
fast e2e and visual test entry points from the `dev` container without changing the existing
production-parity Playwright targets.

**Non-Functional Requirements:**
The main architectural drivers are feedback-loop performance, additive compatibility, deterministic
local behavior, and clear failure diagnostics. The headline SLO is a single-file e2e run under 30
seconds when `dev` is already healthy and browsers are installed. The default dev image must not
grow when browser bundling is disabled, existing Playwright Makefile targets must remain
byte-identical, and `PLAYWRIGHT_DEV_MODE` must stay scoped to the new recipes so IDE, CI, shell, and
production-parity workflows keep their current behavior.

**Scale & Complexity:**
This is a low-complexity brownfield developer-tool change with medium consistency sensitivity. It
touches orchestration and configuration rather than application source code. The design needs enough
structure to prevent agents from choosing different Makefile helper patterns, browser-install flows,
baseline directories, or network wiring.

- Primary domain: developer tooling / test orchestration
- Complexity level: low
- Estimated architectural components: 6

### Technical Constraints & Dependencies

The solution must fit the existing GNU Make, Docker Compose v2, Bun, and Playwright setup. The new
public surface is limited to Make targets and documented variables. The `dev` container hosts
Playwright execution, `mockoon` provides the mock backend, and Chromium browser availability is
either opt-in at image build time or installed idempotently after the fact. The existing
production-parity targets remain the CI-grade path and must not be edited. Playwright config
divergence must be expressed through environment branching in the single existing config file, not
by creating a second config artifact.

### Cross-Cutting Concerns Identified

- Fast local feedback without weakening the existing production-parity test path
- Byte-identical preservation of existing Playwright Makefile targets
- Recipe-scoped environment variables to prevent leakage into IDE and CI workflows
- TTY-aware execution for Playwright Inspector and `page.pause()`
- Separate dev visual baselines with explicit smoke-level semantics
- Opt-in browser installation and image-size containment
- Surgical Docker network wiring so `dev` can reach `mockoon` while `prod` and `playwright` remain
  isolated
- Clear precondition checks and remediation messages for missing browsers, unhealthy dev server,
  unreachable mockoon, or zero matched specs
- Documentation and `make help` output that make the dev/prod distinction hard to miss

## Starter Template Evaluation

### Primary Technology Domain

Brownfield repository workflow / test orchestration inside an existing Rsbuild React application.

This is not a greenfield application bootstrap decision. The architectural foundation already exists
in the `crm` repository: React 18, TypeScript, Rsbuild, Bun, Docker Compose, GNU Make, and
Playwright. The relevant decision is whether to extend that foundation directly or introduce a new
starter/wrapper boundary for dev-mode Playwright execution.

### Current-Version Context

Current registry and documentation checks confirm that maintained greenfield starters exist, but
they solve the wrong problem for this architecture document. As of 2026-04-16, registry checks
showed `@rsbuild/core` latest `1.7.5`, `create-rsbuild` latest `1.7.0`, `@playwright/test` latest
`1.59.1`, and the `bun` npm package latest `1.3.12`. The repository currently pins `@rsbuild/core` `1.6.15`,
`@playwright/test` `^1.57.0`, and `bun@1.3.5`.

The architecture does not require a version upgrade. Version changes would increase blast radius and
are outside this architecture document's additive orchestration scope.

### Starter Options Considered

#### Option 1: Extend the Existing `crm` Repository Foundation

Add the new dev-mode Playwright targets, browser provisioning, config branching, and mockoon network
wiring directly to the existing Makefile, Dockerfile, Compose, and Playwright config.

**What it gives us:**

- Lowest structural change
- Direct alignment with the PRD's additive-only constraint
- No new application starter, wrapper project, or parallel configuration tree
- Best preservation of downstream template-sync expectations
- Direct use of the already-running Docker Compose `dev` service as the execution anchor

#### Option 2: Reinitialize or Migrate Through `create-rsbuild`

Use the current Rsbuild starter tooling as a foundation refresh.

**What it gives us:**

- Current greenfield Rsbuild defaults
- Optional generation of tools such as ESLint, Prettier, Storybook, or testing support

**Trade-offs:**

- Incompatible with the brownfield scope
- High risk of broad unrelated file churn
- Violates the PRD's narrow additive intent
- Does not solve the Makefile/Compose/Playwright orchestration problem directly
- Opens the door to app bootstrap and source-tree changes that the PRD does not request

#### Option 3: Add a Dedicated Playwright Development Service

Create a new Docker Compose service or wrapper dedicated to dev-mode Playwright runs.

**What it gives us:**

- Stronger execution isolation
- Potentially clearer separation between app container and test runner

**Trade-offs:**

- Reintroduces the container indirection the PRD is explicitly trying to avoid
- Duplicates runtime state and increases drift from the `dev` container
- Adds lifecycle, healthcheck, image maintenance, and network complexity
- Weakens the "already-running dev container" feedback-loop goal
- Increases template-sync surface area

### Selected Starter: Existing `crm` Repository Foundation

**Rationale for Selection:**
Use the existing `crm` repository and its current Docker Compose `dev` service as the only execution
foundation. The required behavior is orchestration-only: additive Makefile targets should run
Playwright from inside the already-running `dev` container, without changing application source,
introducing a new Playwright dev service, or altering the current production-parity Playwright path.

This choice preserves the PRD's containment goals: the existing five Playwright targets remain
byte-identical, browser installation stays explicit and opt-in, `PLAYWRIGHT_DEV_MODE` is confined to
recipe scope, and dev-mode visual baselines remain separate smoke-level feedback rather than the
canonical visual regression pipeline.

**Rejected Foundation Paths:**

- `create-rsbuild`: rejected because no app bootstrap, framework migration, or source-tree refresh
  is required.
- Dedicated Playwright dev service: rejected because it duplicates runtime state, adds lifecycle and
  image maintenance, and weakens the requirement to run from the existing `dev` container.
- Separate Playwright config file: rejected because the PRD requires one config with scoped
  environment branching.

**Initialization Command:**

```bash
# No new starter initialization command applies.
# This is a brownfield extension of the existing crm repository foundation.
```

### Architectural Decisions Provided by Starter

**Language & Runtime:**
Preserve the current TypeScript/React runtime and Bun-managed dependency installation. Do not
upgrade or repin framework/runtime versions as part of this architecture; version upgrades are
outside the PRD scope.

**Styling Solution:**
No styling foundation changes. Visual-regression support must work with the app's existing
CSS/MUI/Rsbuild pipeline and must separate dev snapshots from production snapshots rather than
changing component styling infrastructure.

**Build Tooling:**
Preserve Rsbuild as the dev and production build tool. Dev-mode Playwright targets run against the
existing `rsbuild dev` server in the `dev` container. Production-parity Playwright targets continue
to run against the existing production build path.

**Testing Framework:**
Preserve Playwright as the e2e and visual test runner. Add dev-mode invocation paths and config
branching inside the existing `playwright.config.ts`; do not fork Playwright config into a second
file.

**Code Organization:**
Keep all orchestration in existing repository-owned files: `Makefile`, `Dockerfile`, Docker Compose
files, `playwright.config.ts`, `README.md`, and `CLAUDE.md`. Do not add a new package, service
directory, or wrapper project.

**Development Experience:**
Use Makefile targets as the public interface. Browser installation remains opt-in and idempotent.
Debug execution must use TTY-capable Docker Compose exec behavior, while non-debug targets can reuse
the existing TTY-less helper pattern.

### Implementation Guardrails

- Existing targets `test-e2e`, `test-e2e-ui`, `test-visual`, `test-visual-ui`, and
  `test-visual-update` are frozen byte-identical.
- The `dev` container means the existing Docker Compose `dev` service, not a new service or profile.
- `PLAYWRIGHT_DEV_MODE` must be set only inside the new Make recipes to avoid leakage into IDE, CI,
  shell, and non-dev workflows.
- Browser installation must remain opt-in through the Docker build arg or
  `ensure-playwright-browsers`.
- Missing browser/runtime prerequisites must fail with clear remediation, not trigger hidden setup.
- Dev visual baselines must never share the production baseline path.
- New target command wiring should be inspectable with `make -n` before full browser execution.
- Implementation verification must include idempotent `ensure-playwright-browsers` behavior and no
  application-source changes.

## Core Architectural Decisions

### Decision Priority Analysis

**Critical Decisions (Block Implementation):**

- Makefile target contract: add `test-e2e-dev`, `test-visual-dev`, `test-e2e-dev-debug`, and
  `ensure-playwright-browsers` without editing the five existing Playwright targets.
- Execution environment: run dev-mode Playwright from the existing Docker Compose `dev` service.
- Browser scope: dev-mode runs are Chromium-only because browser provisioning is Chromium-only.
- Playwright config branching: use the existing `playwright.config.ts` with recipe-scoped
  `PLAYWRIGHT_DEV_MODE=1`.
- Visual baseline separation: implement dev snapshot separation through Playwright
  `snapshotPathTemplate`, not a second config file.
- Debug execution: use TTY-capable `docker compose exec` for `test-e2e-dev-debug`; do not use
  TTY-less helpers.
- Network boundary: make `mockoon` reachable from `dev` while preserving or correcting the intended
  prod/playwright isolation boundary.

**Important Decisions (Shape Architecture):**

- Browser installation remains explicit and opt-in.
- Missing prerequisites fail fast with remediation text.
- Trace viewer uses `PLAYWRIGHT_TRACE_PORT`, default `9323`.
- README, `CLAUDE.md`, and `make help` must label visual dev snapshots as smoke-level and
  non-CI-gating.

**Deferred Decisions (Post-MVP):**

- `PW_ARGS` pass-through
- `test-visual-dev-update`
- Dev UI-mode variants
- Watch mode
- Dev-baseline pruning
- Firefox/WebKit support for dev-mode targets
- Version upgrades for Rsbuild, Bun, or Playwright

### Data Architecture

No application data architecture changes. Test artifacts, traces, reports, and visual snapshots are
the only persisted outputs. Dev visual baselines must live outside the production snapshot path and
must be treated as advisory developer feedback.

### Authentication & Security

No new auth, secrets, credentials, or tokens are introduced. `PLAYWRIGHT_DEV_MODE` must be set only
inside new Make recipes so dev-mode behavior does not leak into shells, CI, VS Code Playwright
extension runs, or production-parity targets. Browser downloads occur only through explicit opt-in
paths.

### API & Communication Patterns

No API contract changes. Dev-mode Playwright targets use the running dev server as base URL and the
existing `mockoon` service as the mock backend. The implementation must verify current Compose
topology before edits; if prod/playwright are already exposed on `crm-network`, align the final
topology with FR21-FR22 without changing existing production-parity target behavior.

### Frontend Architecture

No React, routing, state, component, or styling architecture changes. Dev-vs-prod behavior belongs
in Playwright configuration only. In dev mode, `projects` should reduce to a Chromium dev
project/tag so the installed browser set matches execution. Production mode keeps the existing
multi-browser projects unchanged.

### Infrastructure & Deployment

Use GNU Make as the public interface. Use the existing Docker Compose `dev` service as the execution
environment. Add Dockerfile support for `INSTALL_PLAYWRIGHT_BROWSERS=false` by default and an
idempotent `ensure-playwright-browsers` target. Do not wire any dev-mode target into CI.

### Decision Impact Analysis

**Implementation Sequence:**

1. Add browser provisioning primitives without changing default image size.
2. Add Makefile helpers and new targets while freezing existing Playwright targets.
3. Add recipe-scoped `PLAYWRIGHT_DEV_MODE` config branching.
4. Restrict dev-mode Playwright projects to Chromium.
5. Add dev snapshot path separation through `snapshotPathTemplate`.
6. Add TTY-capable debug target and trace port mapping.
7. Verify or adjust Compose network topology for `dev` to `mockoon`.
8. Update README, `CLAUDE.md`, and `make help`.
9. Verify `make -n` command wiring and local target behavior.

**Cross-Component Dependencies:**

- Make recipes depend on Docker Compose service names and helper variables.
- Playwright config branching depends on recipe-scoped env only.
- Chromium-only browser provisioning requires Chromium-only dev projects.
- Visual baseline separation depends on project/tag and snapshot path template.
- Debug target depends on TTY allocation and trace port exposure.
- Network decisions must preserve existing production-parity test behavior.

## Implementation Patterns & Consistency Rules

### Pattern Categories Defined

**Critical Conflict Points Identified:**
9 areas where AI agents could make incompatible choices: Makefile placement, target naming,
container env injection, `FILE` forwarding, browser provisioning, Playwright dev-mode branching,
visual snapshot pathing, debug TTY behavior, and Compose network changes.

### Naming Patterns

**Makefile Naming Conventions:**

- Targets: `test-e2e-dev`, `test-visual-dev`, `test-e2e-dev-debug`, `ensure-playwright-browsers`
- Variables: uppercase snake_case near related Playwright/Docker variables
- Required new variables: `EXEC_DEV_TTY`, `RUN_E2E_DEV`, `RUN_VISUAL_DEV`, `PLAYWRIGHT_TRACE_PORT ?=
  9323`
- Do not rename existing variables such as `RUN_E2E`, `RUN_VISUAL`, `PLAYWRIGHT_TEST_CMD`, or
  `EXEC_DEV_TTYLESS`

**Playwright Naming Conventions:**

- Production projects keep current names: `chromium`, `firefox`, `webkit`
- Dev mode uses one Chromium-only project with a distinct name, e.g. `chromium-dev`
- Dev snapshot root uses `tests/visual/__snapshots__-dev/`

### Structure Patterns

**Project Organization:**

- Modify only orchestration/documentation files: `Makefile`, `Dockerfile`, Compose files,
  `playwright.config.ts`, `README.md`, `CLAUDE.md`
- Do not change application files under `src/`
- Do not add a new Playwright config file, package, service directory, or wrapper project
- Add new Makefile variables near existing Playwright/Docker variables
- Add new targets adjacent to existing Playwright targets, without editing the frozen target bodies

**Frozen Target Bodies:**

- `test-e2e`
- `test-e2e-ui`
- `test-visual`
- `test-visual-ui`
- `test-visual-update`

### Format Patterns

**Container Environment Format:**

Set `PLAYWRIGHT_DEV_MODE` inside the `dev` container command, not as a host-side prefix before
`docker compose exec`.

Acceptable patterns:

```makefile
$(EXEC_DEV_TTYLESS) env PLAYWRIGHT_DEV_MODE=1 bun x playwright test ...
$(EXEC_DEV_TTY) env PLAYWRIGHT_DEV_MODE=1 bun x playwright test ...
```

Do not rely on:

```makefile
PLAYWRIGHT_DEV_MODE=1 $(BUNX) playwright test ...
```

**FILE Forwarding Format:**

Do not append raw unquoted `$(FILE)` directly to the Playwright command. Use a shell conditional or
equivalent pattern that preserves quoted globs and treats omitted `FILE` as "run all."

Example intent:

```sh
if [ -n "$$FILE" ]; then
  bun x playwright test "$$TEST_DIR" "$$FILE"
else
  bun x playwright test "$$TEST_DIR"
fi
```

### Communication Patterns

**Operator Feedback:**

- Missing browsers: fail non-zero and print `make ensure-playwright-browsers`
- Missing `FILE` for debug: fail non-zero and name `FILE=tests/e2e/...`
- Unhealthy dev server: rely on `start` / `wait-for-dev` messaging
- Mockoon unreachable: fail non-zero and name the mock backend precondition
- Zero matched specs: preserve Playwright's non-zero behavior and do not mask it

**Documentation Labels:**

Use the phrase "dev-mode visual snapshots are smoke-level and not CI-gating" in README/CLAUDE
guidance and `test-visual-dev` help text where space allows.

### Process Patterns

**Browser Provisioning Pattern:**

- Dockerfile arg: `INSTALL_PLAYWRIGHT_BROWSERS=false` by default
- Install command follows repo-pinned Playwright via Bun, Chromium only
- `ensure-playwright-browsers` is idempotent and explicit
- Dev test targets do not silently install browsers as hidden setup

**Debug Pattern:**

- `test-e2e-dev-debug` requires `FILE`
- Uses `EXEC_DEV_TTY = $(DOCKER_COMPOSE) exec dev`
- Does not use `EXEC_DEV_TTYLESS`, `BUN`, or `BUNX`
- Uses `PLAYWRIGHT_TRACE_PORT ?= 9323`
- Keeps trace/debug support local-only and never CI-wired

**Playwright Config Pattern:**

- Single `playwright.config.ts`
- `isDevMode = process.env.PLAYWRIGHT_DEV_MODE === '1'`
- Dev mode changes only base URL, project list/tag, and snapshot path template
- Production mode preserves existing base URL behavior and multi-browser projects

### Enforcement Guidelines

**All AI Agents MUST:**

- Keep the five existing Playwright targets byte-identical
- Run dev-mode Playwright from the existing `dev` service
- Inject `PLAYWRIGHT_DEV_MODE` inside the container command
- Keep dev-mode Playwright Chromium-only
- Keep dev snapshots outside production snapshot paths
- Keep browser installation opt-in
- Avoid app-source changes
- Verify command wiring with `make -n`
- Verify no dev-mode target is added to CI

**Anti-Patterns:**

- Creating `playwright.dev.config.ts`
- Adding a new `playwright-dev` Compose service
- Reusing production visual snapshot folders for dev mode
- Using host-prefixed env vars that do not enter the container
- Hiding browser installation inside `test-e2e-dev`
- Adding `PW_ARGS` or dev UI-mode variants in MVP

## Project Structure & Boundaries

This section defines where changes may happen and which files own each boundary. It is not an
implementation recipe.

### Complete Project Directory Structure

Target-state repository change delta only; this architecture document does not introduce a new
project root.

```text
crm/
├── Makefile                         # Execution owner: new dev-mode target wiring
├── Dockerfile                       # Provisioning owner: opt-in browser install arg
├── docker-compose.yml               # Runtime owner: existing dev service, trace port if required
├── playwright.config.ts             # Config: dev branch, Chromium project, snapshot path
├── README.md                        # Operator docs: examples and visual-dev semantics
├── CLAUDE.md                        # Agent/developer docs: workflow and guardrails
├── tests/
│   ├── e2e/                         # Existing specs; no required source changes
│   └── visual/
│       ├── *.spec.ts                # Existing visual specs; no required source changes
│       ├── *-snapshots/             # Existing production snapshot folders; not used by dev mode
│       └── __snapshots__-dev/       # New/advisory dev-mode visual snapshot root
└── .github/
    └── workflows/                   # No dev-mode target wiring
```

`docker-compose.test.yml` is not part of the primary target-state structure. Touch it only if
implementation verification proves a concrete network gap that cannot be resolved through the
existing `docker-compose.yml` `dev` service path. Any such change must preserve existing
production-parity target behavior.

### Ownership Map

| File / Area | Owns | Must Not Own |
|---|---|---|
| `Makefile` | Targets, wiring, `FILE`, env, preconditions | App, PW projects, hidden installs |
| `Dockerfile` | `INSTALL_PLAYWRIGHT_BROWSERS=false`; opt-in | Default bundling, target invocation |
| `docker-compose.yml` | `dev` runtime; trace port if needed | New PW service, prod orchestration |
| `playwright.config.ts` | `PLAYWRIGHT_DEV_MODE` branch, snapshot path | Separate config file |
| `tests/visual/__snapshots__-dev/` | Advisory dev snapshots | Production visual baselines |
| `README.md` / `CLAUDE.md` | Operator and agent guidance | Functional architecture or runtime |
| `.github/workflows/` | Existing CI only | Dev-mode target wiring |

### Architectural Boundaries

**Execution Boundary:**
Dev-mode runs execute only through the existing `dev` service plus `mockoon`. They do not route
through `prod` or the `playwright` service.

**API Boundaries:**
No API contracts change. Dev-mode Playwright talks to the dev server and the existing mock backend
only. Application API clients, GraphQL/Apollo code, and backend mocks remain outside this
architecture except for Mockoon reachability.

**Component Boundaries:**
No React component, routing, state, or styling boundaries change. `src/` is out of scope.

**Service Boundaries:**

- `dev`: execution anchor for new dev-mode Playwright targets
- `mockoon`: mock API dependency required for dev-mode verification; not a new dependency boundary
- `prod`: remains the production-parity target for existing Playwright flows
- `playwright`: remains the existing production-parity test runner service
- No new `playwright-dev` or equivalent service

**Data Boundaries:**
Only generated test artifacts are affected. Production visual snapshots and dev visual snapshots
must be separate. Trace/report artifacts stay in existing ignored Playwright output paths.

### Boundary Map

```text
Dev-mode path:
Makefile
  -> docker-compose.yml dev service
    -> dev container
      -> env PLAYWRIGHT_DEV_MODE=1
        -> Playwright Chromium dev project
          -> dev server + mockoon
          -> tests/visual/__snapshots__-dev/

Production-parity path:
Makefile frozen targets
  -> start-prod
    -> prod + playwright services
      -> existing Playwright multi-browser projects
      -> existing production visual snapshot folders
```

### Requirements to Structure Mapping

**Dev Test Execution (FR1-FR4):**

- `Makefile`: `test-e2e-dev`, `test-visual-dev`
- `playwright.config.ts`: dev baseURL branch
- `docker-compose.yml`: existing `dev` service boundary

**File Targeting (FR5-FR8):**

- `Makefile`: `FILE` forwarding logic inside new targets only

**Debug Surface (FR9-FR12, FR28):**

- `Makefile`: `test-e2e-dev-debug`, `EXEC_DEV_TTY`, `PLAYWRIGHT_TRACE_PORT ?= 9323`
- `docker-compose.yml`: expose trace port from `dev` if needed

**Browser Provisioning (FR13-FR15, FR29):**

- `Dockerfile`: `INSTALL_PLAYWRIGHT_BROWSERS=false` default
- `Makefile`: `ensure-playwright-browsers`
- README/CLAUDE: one-time setup and remediation guidance

**Visual Baseline Management (FR16-FR18):**

- `playwright.config.ts`: `snapshotPathTemplate` dev branch
- `tests/visual/__snapshots__-dev/`: advisory dev baseline root for fast-fail visual checks
- README/CLAUDE: advisory, non-CI-gating semantics

**Configuration Branching (FR19-FR20):**

- `playwright.config.ts`: single config file with `PLAYWRIGHT_DEV_MODE`
- `Makefile`: pass runtime intent into the container; the container decides dev-mode behavior

**Network Topology (FR21-FR22):**

- `docker-compose.yml`: primary boundary for dev service runtime
- `docker-compose.test.yml`: only touched if verified network topology requires it

**Backwards Compatibility & Discoverability (FR23-FR25):**

- `Makefile`: new help strings; frozen existing target bodies
- `README.md`: runnable single-file examples

**Operator Feedback (FR26-FR27):**

- `Makefile`: explicit precondition checks/remediation messages
- Playwright native exit codes preserved

### Integration Points

**Dev Execution Path:**

```text
make test-e2e-dev FILE=...
  -> docker compose up dev via start
  -> docker compose exec -T dev env PLAYWRIGHT_DEV_MODE=1 ...
  -> playwright.config.ts selects dev baseURL/project/snapshot behavior
  -> dev server + mockoon handle browser traffic
```

**Debug Execution Path:**

```text
make test-e2e-dev-debug FILE=...
  -> docker compose exec dev ...   # TTY allocated
  -> Playwright Inspector/page.pause()
  -> trace viewer reachable on PLAYWRIGHT_TRACE_PORT
```

**Production-Parity Path:**

```text
make test-e2e / test-visual
  -> unchanged start-prod path
  -> existing playwright service
  -> existing production snapshots and multi-browser projects
```

**Artifact Split:**

```text
Production visual baselines:
tests/visual/*-snapshots/

Dev fast-fail visual checks:
tests/visual/__snapshots__-dev/
```

### Verification Map

| Flow | Verification Command / Check | Expected Boundary |
|---|---|---|
| Command wiring | `make -n test-e2e-dev FILE=tests/e2e/<spec>.ts` | Uses `dev`; not `start-prod` |
| Dev e2e run | `make test-e2e-dev FILE=tests/e2e/<spec>.ts` | `PLAYWRIGHT_DEV_MODE` in container |
| Dev visual run | `make test-visual-dev FILE=tests/visual/<spec>.ts` | Dev snapshot path only |
| Debug run | `make test-e2e-dev-debug FILE=tests/e2e/<spec>.ts` | TTY allocated; `FILE` required |
| Browser setup | `make ensure-playwright-browsers` twice | Second run clean, no redownload |
| Production parity | `make test-e2e` / `make test-visual` | Existing bodies and paths unchanged |
| CI scope | inspect `.github/workflows/` diff | No dev-mode target wiring |

### File Organization Patterns

**Configuration Files:**

- `playwright.config.ts` remains the only Playwright config.
- Docker/Compose changes remain in existing root files.
- No new root config file unless implementation proves unavoidable and the architecture is updated.

**Source Organization:**

- `src/` remains untouched.
- No feature/module additions.

**Test Organization:**

- Existing `tests/e2e/` and `tests/visual/` specs remain in place.
- Dev-mode baselines use `tests/visual/__snapshots__-dev/`.
- Production snapshot folders remain untouched by dev-mode targets.

**Documentation Organization:**

- README gets contributor-facing examples.
- CLAUDE gets AI-agent/developer workflow guidance.
- Makefile `##` comments provide `make help` discoverability.

### Development Workflow Integration

**Development Server Structure:**
`make start` remains the way to bring up the `dev` service. Dev-mode Playwright targets depend on
`start`, not `start-prod`.

**Build Process Structure:**
Default dev image build remains browser-free. Browser-enabled dev image build is opt-in through
`INSTALL_PLAYWRIGHT_BROWSERS=true`.

**Deployment Structure:**
No deployment or CI structure changes. Dev-mode targets are local-only and must not be added to
GitHub Actions.

### Do Not Change

- Do not edit the bodies of `test-e2e`, `test-e2e-ui`, `test-visual`, `test-visual-ui`, or
  `test-visual-update`.
- Do not add a new Compose service.
- Do not edit application source under `src/`.
- Do not add CI wiring for dev-mode targets.
- Do not make browser installation part of the default runtime path.
- Do not let dev-mode snapshots share production baseline folders.

## Architecture Validation Results

### Coherence Validation

**Decision Compatibility:**
The architecture is coherent: all decisions point to a narrow brownfield orchestration change. The
selected foundation, Makefile public surface, existing `dev` service execution anchor, single
`playwright.config.ts`, Chromium-only dev mode, opt-in browser provisioning, and advisory dev
snapshot path all reinforce the same goal: fast local Playwright feedback without changing the
production-parity path.

**Pattern Consistency:**
Implementation patterns support the architectural decisions. Target names, variable names,
container-internal env injection, TTY-vs-TTY-less execution, `FILE` handling, and dev snapshot
pathing are all locked enough to prevent common agent drift. The anti-pattern list directly blocks
the highest-risk variants: new service, second Playwright config, shared visual baselines, hidden
browser install, and MVP scope expansion.

**Structure Alignment:**
The project structure supports the architecture. Functional ownership is limited to `Makefile`,
`Dockerfile`, `docker-compose.yml`, and `playwright.config.ts`; documentation ownership is separate
in `README.md` and `CLAUDE.md`; test artifacts are isolated under `tests/visual/__snapshots__-dev/`.
The structure explicitly excludes `src/`, `.github/workflows/`, new Compose services, and new config
roots.

### Requirements Coverage Validation

**Functional Requirements Coverage:**
All 29 functional requirements are architecturally supported.

- FR1-FR4: covered by dev-mode Makefile targets depending on `start` and the existing `dev` service.
- FR5-FR8: covered by scoped `FILE` forwarding rules.
- FR9-FR12: covered by `test-e2e-dev-debug`, TTY execution, and `PLAYWRIGHT_TRACE_PORT`.
- FR13-FR15: covered by opt-in Dockerfile browser install and idempotent
  `ensure-playwright-browsers`.
- FR16-FR18: covered by dev snapshot separation and fast-fail/advisory visual checks.
- FR19-FR20: covered by single-config `PLAYWRIGHT_DEV_MODE` branching and container-internal env
  injection.
- FR21-FR22: covered by the network boundary requirement and explicit implementation audit of
  current Compose topology.
- FR23-FR25: covered by frozen existing Playwright targets, new `make help` entries, and README
  examples.
- FR26-FR29: covered by precondition messaging, preserved Playwright exit codes, trace port default,
  and missing-browser remediation.

**Non-Functional Requirements Coverage:**
The architecture addresses all relevant NFR categories. Performance is supported by avoiding
`start-prod` and running in the already-running `dev` service. Reliability is supported by clear
prerequisite boundaries and native Playwright exit codes. Maintainability is supported by one config
file, additive targets, and no app-source changes. Portability is supported by existing Make/Docker
Compose conventions. Security is supported by no new secrets and explicit browser-download opt-in.
Integration compatibility is supported by recipe/container-scoped dev mode and no CI wiring.

### Implementation Readiness Validation

**Decision Completeness:**
Critical decisions are documented with names, files, and boundaries. Current-version research was
performed for Rsbuild, Playwright, and Bun; no version upgrade is required by this architecture.

**Structure Completeness:**
The target-state file tree is specific and minimal. It separates execution files, artifact paths,
documentation files, and excluded areas. Ownership and verification maps give implementers enough
direction to avoid reinterpreting scope.

**Pattern Completeness:**
The highest-risk implementation conflict points are covered: target placement, env injection, `FILE`
forwarding, browser install behavior, dev project selection, snapshot pathing, debug TTY allocation,
network boundaries, and CI exclusion.

### Gap Analysis Results

**Critical Gaps:**
None blocking implementation.

**Important Validation Notes:**

- Current Compose topology must be audited during implementation. If `prod` or `playwright` are
  already exposed on `crm-network`, align the final topology with FR21-FR22 without breaking
  existing production-parity targets.
- `snapshotPathTemplate` implementation must be verified against the repo's current visual snapshot
  naming pattern before accepting dev baselines.
- `PLAYWRIGHT_DEV_MODE` must be proven inside the container, not just in the host Make process.
- `ensure-playwright-browsers` idempotency must be verified by running it twice.

**Nice-to-Have Gaps:**

- A future implementation plan can add exact shell snippets for `FILE` forwarding and browser
  readiness checks.
- A future story can add dev snapshot cleanup if advisory baselines accumulate.

### Validation Issues Addressed

Party Mode review identified structure drift risks in Step 6. These were addressed by removing
`docker-compose.test.yml` from the primary target file tree, adding an ownership map, adding a
verification map, separating documentation from functional ownership, and adding a "Do Not Change"
invariant block.

### Architecture Completeness Checklist

#### Requirements Analysis

- [x] Project context thoroughly analyzed
- [x] Scale and complexity assessed
- [x] Technical constraints identified
- [x] Cross-cutting concerns mapped

#### Architectural Decisions

- [x] Critical decisions documented
- [x] Existing technology stack preserved
- [x] Integration patterns defined
- [x] Performance and feedback-loop considerations addressed
- [x] Deferred scope explicitly listed

#### Implementation Patterns

- [x] Naming conventions established
- [x] Structure patterns defined
- [x] Container env and debug process patterns specified
- [x] Anti-patterns documented

#### Project Structure

- [x] Target-state file structure defined
- [x] Ownership boundaries established
- [x] Integration points mapped
- [x] Requirements to structure mapping complete
- [x] Verification map included

### Architecture Readiness Assessment

**Overall Status:** READY FOR IMPLEMENTATION

**Confidence Level:** High, with one implementation audit item around current Compose network
topology.

**Key Strengths:**

- Minimal blast radius
- Clear separation between dev-mode and production-parity paths
- Strong guardrails against hidden browser install, CI drift, and app-source changes
- Concrete ownership and verification maps for implementers
- Explicit protection of the five existing Playwright targets

**Areas for Future Enhancement:**

- `PW_ARGS` pass-through
- Dev UI-mode targets
- Dev visual baseline update/cleanup helpers
- Broader browser support beyond Chromium
- Watch mode

### Implementation Handoff

**AI Agent Guidelines:**

- Follow the architecture exactly; do not add new services, config files, or CI wiring.
- Keep `PLAYWRIGHT_DEV_MODE` container-internal.
- Preserve the five existing Playwright targets byte-identical.
- Verify command wiring with `make -n` before browser execution.
- Treat dev visual snapshots as advisory fast-fail checks, not canonical baselines.

**First Implementation Priority:**
Add the Makefile helper variables and new target skeletons adjacent to the existing Playwright
targets, then verify with `make -n` that the dev-mode targets route through `dev` and not
`start-prod`.
