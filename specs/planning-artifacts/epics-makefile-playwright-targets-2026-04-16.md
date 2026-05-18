---
stepsCompleted:
  - step-01-validate-prerequisites
  - step-02-design-epics
  - step-03-create-stories
  - step-04-final-validation
inputDocuments:
  - specs/planning-artifacts/prd-makefile-playwright-targets-2026-04-16.md
  - specs/planning-artifacts/architecture-makefile-playwright-targets-2026-04-16.md
---

<!-- markdownlint-disable -->

# crm - Epic Breakdown

## Overview

This document provides the complete epic and story breakdown for crm, decomposing the requirements from the PRD, UX Design if it exists, and Architecture requirements into implementable stories.

## Requirements Inventory

### Functional Requirements

FR1: Developer can run the full Playwright e2e suite against the running dev server via a single `make` invocation.

FR2: Developer can run the full Playwright visual-regression suite against the running dev server via a single `make` invocation.

FR3: System starts the dev container when a dev-mode test target is invoked and the container is not running.

FR4: System reuses a running, healthy dev container without restart or rebuild when a dev-mode test target is invoked. Healthy is defined as Docker Compose `running` state and dev HTTP port responding.

FR5: Developer can scope a dev-mode e2e run to a single spec file via a `FILE=` argument.

FR6: Developer can scope a dev-mode visual run to a single spec file via a `FILE=` argument.

FR7: Developer can pass a shell glob to `FILE=`; the quoted value is forwarded verbatim and resolution is delegated to Playwright.

FR8: System treats an omitted `FILE=` argument as "run the whole suite" without requiring a placeholder value.

FR9: Developer can launch a dev-mode e2e run in interactive debug mode with the Playwright Inspector attached.

FR10: Playwright trace viewer is reachable from the host on a documented default port, `9323`.

FR11: Developer can override the trace-viewer port via the `PLAYWRIGHT_TRACE_PORT` variable.

FR12: Developer can use `page.pause()`, Playwright Inspector prompts, and REPL input during a dev-mode debug run.

FR13: Maintainer can opt the dev image in to Playwright-browser bundling via a single Docker build argument, default off.

FR14: Developer can run a one-command Makefile target to install Playwright browsers into the dev container after the fact, when the image was built without them.

FR15: Re-running `make ensure-playwright-browsers` is safe; it exits successfully without re-downloading when installed browser versions match the Playwright version pinned in `package.json`, and it reports on exit whether browsers are ready.

FR16: System stores dev-mode visual baselines in a directory distinct from the production-mode baseline directory.

FR17: System tags dev-mode visual runs so they are distinguishable in Playwright reports from production-mode runs.

FR18: Developer can regenerate dev-mode visual baselines explicitly, via the debug surface or equivalent, without affecting production-mode baselines.

FR19: Developer can invoke dev-mode and production-mode Playwright runs with distinct baseURL, snapshot directory, and project tag without maintaining duplicate configuration artifacts.

FR20: System does not leak the dev-mode environment flag into unrelated developer workflows, including the VS Code Playwright extension, CI runs, the existing five production-parity targets, or interactive shells started with `make sh`.

FR21: System makes the mockoon mock-API service reachable from the dev container on the same external network the dev container already joins.

FR22: System keeps the `prod` and `playwright` services isolated from the dev network so they cannot be mistakenly reached from the dev container.

FR23: System preserves the five existing Playwright-related Makefile targets byte-for-byte so downstream template-sync consumers pull a clean additive diff. Whitespace or comment polish on those targets is out of scope.

FR24: Each new target appears in `make help` output with a description no longer than 80 characters naming the target's purpose and indicating dev-mode.

FR25: The README's testing section contains a runnable example invoking `make test-e2e-dev FILE=<real repo spec path>`, placed alongside existing Playwright documentation.

FR26: When invoked with the dev container not running, browsers absent, mockoon unreachable, or `FILE=` matching zero specs, a dev-mode target exits non-zero with a message naming the unmet precondition and the remediation command.

FR27: Dev-mode test targets exit non-zero when any spec fails and zero when all specs pass, so CI-adjacent tooling can consume the result.

FR28: The trace-viewer default port does not overlap with `DEV_PORT` (`3000`), `PROD_PORT` (`3001`), or `GRAPHQL_PORT` (`4000`) in default configuration.

FR29: When `INSTALL_PLAYWRIGHT_BROWSERS=false` was used at image build time, invoking `test-e2e-dev`, `test-visual-dev`, or `test-e2e-dev-debug` before `make ensure-playwright-browsers` fails fast with the remediation message defined in FR26.

### NonFunctional Requirements

NFR1: A single-file e2e run via `make test-e2e-dev FILE=<spec>` completes within 30 seconds wall-clock when the dev container is already healthy and Playwright browsers are installed.

NFR2: First invocation of `make ensure-playwright-browsers` on a fresh dev container completes within 5 minutes on a broadband connection of at least 50 Mbps.

NFR3: Subsequent idempotent invocations of `make ensure-playwright-browsers`, when nothing needs downloading, complete within 30 seconds.

NFR4: Makefile and Docker-exec orchestration adds no more than 5 seconds of overhead on top of raw Playwright execution time for a single-spec run.

NFR5: Dev-mode targets achieve at least 95% first-run success rate on a healthy, correctly provisioned dev container, excluding test-level flakes.

NFR6: Visual-regression dev-mode baselines are explicitly not CI-gating; `make help` output and README both carry the "not CI-gating" label alongside the `test-visual-dev` target.

NFR7: Enabling `INSTALL_PLAYWRIGHT_BROWSERS=true` at image-build time adds no more than 350 MB to the dev image size after image pruning.

NFR8: Default dev image size with `INSTALL_PLAYWRIGHT_BROWSERS=false` changes by 0 bytes plus or minus 5 MB from the pre-PRD baseline.

NFR9: The implementation produces a zero-line diff on the five existing Playwright-related Makefile targets enumerated in FR23.

NFR10: All new Makefile recipes pass `make lint`, including shellcheck and markdown-lint, without suppressions.

NFR11: Dev-mode targets function identically on Linux and macOS hosts running Docker Desktop or a compatible engine; Windows support follows the repo's existing WSL2 best-effort posture.

NFR12: Recipes do not introduce GNU-only shell features beyond those already in use in the existing Makefile, and do not add new bashisms in `/bin/sh` recipe lines.

NFR13: With `INSTALL_PLAYWRIGHT_BROWSERS=false` by default, the Dockerfile introduces no additional network access at image-build time. Browser downloads happen only when the arg is explicitly set to `true` at build, or when `make ensure-playwright-browsers` is explicitly invoked.

NFR14: No new secrets, credentials, or tokens are introduced. Trace files and test artifacts are written to paths already covered by the repo's `.gitignore` or `.dockerignore`.

NFR15: The VS Code Playwright Test extension continues to use the production-oriented default configuration; no `PLAYWRIGHT_DEV_MODE` is present in the extension's inherited environment.

NFR16: Downstream VilnaCRM microservice repos consuming this template pull the changes with zero manual conflict resolution on files touched by this PRD, beyond the byte-identical hard-no-touch five targets.

### Additional Requirements

- No greenfield starter or framework migration applies; extend the existing `crm` repository foundation.
- Preserve the current React, TypeScript, Rsbuild, Bun, Docker Compose, GNU Make, and Playwright stack without version upgrades in this scope.
- Do not add a new Playwright dev service, wrapper package, service directory, or separate Playwright config file.
- Limit implementation ownership to orchestration and documentation files: `Makefile`, `Dockerfile`, Docker Compose files, `playwright.config.ts`, `README.md`, and `CLAUDE.md`.
- Do not modify application source under `src/`.
- Do not wire dev-mode targets into `.github/workflows/` or any CI path.
- Add Makefile targets named `test-e2e-dev`, `test-visual-dev`, `test-e2e-dev-debug`, and `ensure-playwright-browsers`.
- Add Makefile variables following existing uppercase snake_case patterns, including `EXEC_DEV_TTY`, `RUN_E2E_DEV`, `RUN_VISUAL_DEV`, and `PLAYWRIGHT_TRACE_PORT ?= 9323`.
- Keep existing variables such as `RUN_E2E`, `RUN_VISUAL`, `PLAYWRIGHT_TEST_CMD`, and `EXEC_DEV_TTYLESS` unchanged.
- Keep the bodies of `test-e2e`, `test-e2e-ui`, `test-visual`, `test-visual-ui`, and `test-visual-update` byte-identical.
- Run dev-mode Playwright from the existing Docker Compose `dev` service.
- Set `PLAYWRIGHT_DEV_MODE` inside the container command, using `env PLAYWRIGHT_DEV_MODE=1`, not as a host-side prefix before `docker compose exec`.
- Keep `PLAYWRIGHT_DEV_MODE` scoped to the new Make recipes only; do not set it as a Dockerfile `ENV`, Compose environment entry, top-level Make variable, inherited shell setting, IDE setting, or CI variable.
- Use a single `playwright.config.ts` with `process.env.PLAYWRIGHT_DEV_MODE === '1'` to branch base URL, project list or tag, and snapshot path template.
- Keep dev-mode Playwright Chromium-only so the installed browser set matches execution.
- Preserve current production Playwright project names and behavior, including `chromium`, `firefox`, and `webkit`.
- Use a distinct dev Playwright project name, such as `chromium-dev`.
- Store dev visual snapshots outside production snapshot folders, using `tests/visual/__snapshots__-dev/` as the intended advisory snapshot root.
- Treat dev-mode visual snapshots as smoke-level and not CI-gating in README, `CLAUDE.md`, and `make help` guidance.
- Use a `snapshotPathTemplate` implementation that is verified against the repository's existing visual snapshot naming pattern.
- Implement `FILE` forwarding with shell-safe conditional logic that preserves quoted globs and treats omitted `FILE` as "run all"; do not append raw unquoted `$(FILE)` directly to the Playwright command.
- Make `test-e2e-dev-debug` require `FILE`, allocate a TTY with `docker compose exec dev`, and avoid TTY-less helpers such as `EXEC_DEV_TTYLESS`, `BUN`, and `BUNX`.
- Expose or support trace viewer access on `PLAYWRIGHT_TRACE_PORT`, defaulting to `9323`.
- Keep browser provisioning explicit and opt-in through `INSTALL_PLAYWRIGHT_BROWSERS=false` by default or `make ensure-playwright-browsers`.
- Do not silently install browsers as part of `test-e2e-dev`, `test-visual-dev`, or `test-e2e-dev-debug`.
- Missing browser/runtime prerequisites must fail non-zero with remediation text naming `make ensure-playwright-browsers`.
- Make mockoon reachable from the dev container while preserving the intended isolation of `prod` and `playwright` from the dev network.
- Audit current Docker Compose topology during implementation; if `prod` or `playwright` are already exposed on `crm-network`, align the final topology with FR21-FR22 without breaking production-parity targets.
- Preserve native Playwright non-zero behavior for zero matched specs and failed specs; do not mask those failures.
- Verify command wiring with `make -n` before full browser execution.
- Verify `PLAYWRIGHT_DEV_MODE` inside the container, not just in the host Make process.
- Verify `ensure-playwright-browsers` idempotency by running it twice.
- Verify no dev-mode target is added to CI.

### UX Design Requirements

No UX Design document was included for this epic/story breakdown. No separate UX design requirements were extracted.

### FR Coverage Map

FR1: Epic 1 - Run full e2e suite against dev server via `make`.

FR2: Epic 2 - Run full visual suite against dev server via `make`.

FR3: Epic 1 - Start `dev` when a dev-mode target is invoked.

FR4: Epic 1 - Reuse a healthy running `dev` container.

FR5: Epic 1 - Scope e2e runs with `FILE=`.

FR6: Epic 2 - Scope visual runs with `FILE=`.

FR7: Epic 1 - Preserve quoted glob forwarding to Playwright.

FR8: Epic 1 - Treat omitted `FILE=` as full-suite execution.

FR9: Epic 3 - Launch interactive e2e debug mode.

FR10: Epic 3 - Expose trace viewer on default port `9323`.

FR11: Epic 3 - Allow `PLAYWRIGHT_TRACE_PORT` override.

FR12: Epic 3 - Support `page.pause()`, Inspector prompts, and REPL input.

FR13: Epic 1 - Opt dev image into browser bundling via build arg.

FR14: Epic 1 - Install Playwright browsers after the fact with one Make target.

FR15: Epic 1 - Make browser installation idempotent and version-aware.

FR16: Epic 2 - Store dev visual baselines separately from production baselines.

FR17: Epic 2 - Tag dev visual runs distinctly in reports.

FR18: Epic 2 - Regenerate dev visual baselines without affecting production baselines.

FR19: Epic 1 - Use one Playwright config with dev/prod branching.

FR20: Epic 4 - Prevent `PLAYWRIGHT_DEV_MODE` leakage.

FR21: Epic 1 - Make `mockoon` reachable from `dev`.

FR22: Epic 4 - Keep `prod` and `playwright` isolated from the dev network.

FR23: Epic 4 - Preserve existing Playwright targets byte-for-byte.

FR24: Epic 4 - Add discoverable `make help` entries for new targets.

FR25: Epic 4 - Add README single-file usage example.

FR26: Epic 1 - Fail non-zero with clear remediation for unmet preconditions.

FR27: Epic 1 - Preserve useful zero/non-zero exit behavior.

FR28: Epic 3 - Avoid default trace port collision.

FR29: Epic 1 - Fail fast when browsers are absent and remediation is needed.

## Epic List

### Epic 1: Fast Dev E2E Execution

Developers can run Playwright e2e tests from the existing `dev` container with a fast one-command loop, including full-suite runs, single-file runs, browser readiness, mockoon reachability, and clear failure behavior.

**FRs covered:** FR1, FR3, FR4, FR5, FR7, FR8, FR13, FR14, FR15, FR19, FR21, FR26, FR27, FR29

### Epic 2: Dev Visual Smoke Workflow

Visual-regression authors can run fast dev-build visual checks without polluting production baselines, with separate dev snapshots, clear report tagging, and documented smoke-level semantics.

**FRs covered:** FR2, FR6, FR16, FR17, FR18

### Epic 3: Interactive Dev Debugging

Developers can debug a single e2e spec interactively from the dev container using Playwright Inspector, `page.pause()`, REPL input, and host-accessible trace viewer ports.

**FRs covered:** FR9, FR10, FR11, FR12, FR28

### Epic 4: Safe Adoption, Compatibility, and Discoverability

Platform maintainers and downstream template consumers can adopt the new dev-mode targets without breaking existing Playwright workflows, leaking dev-mode config, exposing isolated services, or losing documentation clarity.

**FRs covered:** FR20, FR22, FR23, FR24, FR25

## Epic 1: Fast Dev E2E Execution

Developers can run Playwright e2e tests from the existing `dev` container with a fast one-command loop, including full-suite runs, single-file runs, browser readiness, mockoon reachability, and clear failure behavior.

### Story 1.1: Install Playwright Browsers for Dev Runs

As a frontend engineer,
I want an explicit Makefile target to install or verify Playwright browsers inside the dev container,
So that dev-mode Playwright runs can execute without hidden setup or image-size cost by default.

**Requirements covered:** FR13, FR14, FR15, FR29

**Acceptance Criteria:**

**Given** the dev image is built with the default browser-install setting
**When** the image build completes
**Then** Playwright browsers are not installed by default
**And** the default dev image size remains within the NFR8 budget.

**Given** a maintainer builds the dev image with `INSTALL_PLAYWRIGHT_BROWSERS=true`
**When** the Dockerfile build reaches the browser provisioning step
**Then** Chromium is installed through the repo-pinned Playwright/Bun toolchain
**And** no Firefox or WebKit browsers are installed for dev-mode scope.

**Given** the `dev` container is running without Playwright browsers installed
**When** a developer runs `make ensure-playwright-browsers`
**Then** the target installs Chromium browsers inside the dev container
**And** exits zero when browser installation succeeds
**And** reports that browsers are ready.

**Given** Playwright browsers already match the repo-pinned Playwright version
**When** a developer runs `make ensure-playwright-browsers` again
**Then** the target exits zero without re-downloading browsers
**And** completes within the NFR3 idempotent-run budget.

**Given** `INSTALL_PLAYWRIGHT_BROWSERS=false` was used at image build time
**When** a developer invokes `make test-e2e-dev`, `make test-visual-dev`, or `make test-e2e-dev-debug` before browser provisioning
**Then** the target fails fast with a non-zero exit code
**And** the message names the missing browser precondition
**And** the message includes `make ensure-playwright-browsers` as the remediation command.

**Given** the Makefile help output is generated
**When** a developer runs `make help`
**Then** `ensure-playwright-browsers` appears with a concise description
**And** the description indicates it installs Playwright browsers for dev-mode runs.

**Given** a developer reads the project testing documentation
**When** they look for dev-mode Playwright setup instructions
**Then** the README documents `make ensure-playwright-browsers`
**And** explains that browser installation is explicit and opt-in, not hidden inside test targets.

### Story 1.2: Run Dev E2E Tests from the Dev Container

As a frontend engineer authoring Playwright tests,
I want `make test-e2e-dev` to run e2e specs from the existing `dev` container,
So that I can get fast local feedback without starting the production test stack.

**Requirements covered:** FR1, FR3, FR4, FR19, FR21, FR27

**Acceptance Criteria:**

**Given** the `dev` container is not running
**When** a developer runs `make test-e2e-dev`
**Then** the target starts the existing Docker Compose `dev` service through the existing `start` path
**And** it does not invoke `start-prod`.

**Given** the `dev` container is already running and the dev HTTP port responds
**When** a developer runs `make test-e2e-dev`
**Then** the target reuses the running `dev` container
**And** does not rebuild or restart the container.

**Given** Playwright browsers are installed in the `dev` container
**And** the dev server is healthy
**And** `mockoon` is reachable from `dev`
**When** a developer runs `make test-e2e-dev`
**Then** Playwright runs the full e2e suite from inside the `dev` container
**And** uses the dev server as the base URL
**And** exits zero when all specs pass.

**Given** at least one e2e spec fails during `make test-e2e-dev`
**When** Playwright exits non-zero
**Then** the Makefile target also exits non-zero
**And** the failure is not masked by wrapper shell logic.

**Given** `make test-e2e-dev` invokes Playwright from inside the `dev` container
**When** the command is inspected with `make -n test-e2e-dev`
**Then** the command uses `docker compose exec -T dev`
**And** sets `PLAYWRIGHT_DEV_MODE=1` inside the container command with `env`
**And** does not rely on a host-side `PLAYWRIGHT_DEV_MODE=1` prefix.

**Given** `PLAYWRIGHT_DEV_MODE=1` is present inside the container command
**When** `playwright.config.ts` resolves configuration
**Then** the existing single Playwright config selects the dev-mode base URL and dev project behavior
**And** no separate Playwright config file is introduced.

**Given** dev-mode e2e execution requires the mock backend
**When** `make test-e2e-dev` is invoked
**Then** the existing `mockoon` service is reachable from the `dev` container on the required Docker network
**And** no new mock service or Playwright dev service is introduced.

**Given** the Makefile help output is generated
**When** a developer runs `make help`
**Then** `test-e2e-dev` appears with a description no longer than 80 characters
**And** the description names dev-mode e2e execution.

**Given** a developer reads the project testing documentation
**When** they look for fast Playwright e2e workflow guidance
**Then** the README documents `make test-e2e-dev`
**And** explains that this path runs against the dev build and does not replace production-parity `make test-e2e`.

### Story 1.3: Scope Dev E2E Runs with FILE

As a frontend engineer debugging a specific spec,
I want `FILE=` support for `test-e2e-dev`,
So that I can run a single test file or quoted glob without running the full suite.

**Requirements covered:** FR5, FR7, FR8

**Acceptance Criteria:**

**Given** Playwright browsers are installed
**And** the `dev` container is healthy
**When** a developer runs `make test-e2e-dev FILE=tests/e2e/signup.spec.ts`
**Then** Playwright runs only the requested e2e spec file
**And** the command still executes inside the existing `dev` container.

**Given** a developer omits `FILE=`
**When** they run `make test-e2e-dev`
**Then** Playwright runs the full e2e suite
**And** no placeholder value is required.

**Given** a developer passes a quoted glob to `FILE=`
**When** they run `make test-e2e-dev FILE='tests/e2e/auth-*.spec.ts'`
**Then** the quoted value is forwarded safely to Playwright
**And** glob resolution is delegated to Playwright rather than host-shell expansion.

**Given** `FILE=` support is implemented in the Makefile
**When** the command is inspected with `make -n test-e2e-dev FILE='tests/e2e/auth-*.spec.ts'`
**Then** the recipe does not append raw unquoted `$(FILE)` directly to the Playwright command
**And** uses shell-safe conditional logic for empty versus non-empty `FILE`.

**Given** `FILE=` points to a path or glob matching zero specs
**When** Playwright reports zero matched tests
**Then** `make test-e2e-dev` exits non-zero
**And** the wrapper does not mask Playwright's native failure.

**Given** a developer reads the project testing documentation
**When** they look for single-file e2e examples
**Then** the README includes a runnable `make test-e2e-dev FILE=<real repo spec path>` example
**And** includes a quoted-glob example for matching multiple specs.

### Story 1.4: Report Dev E2E Preconditions Clearly

As a developer running dev-mode e2e tests,
I want unmet preconditions to fail fast with specific remediation,
So that I know whether to start dev, install browsers, fix mockoon reachability, or correct the file path.

**Requirements covered:** FR26, FR27, FR29

**Acceptance Criteria:**

**Given** Playwright browsers are absent from the `dev` container
**When** a developer runs `make test-e2e-dev`
**Then** the target exits non-zero before running specs
**And** the output names the missing browser precondition
**And** the output includes `make ensure-playwright-browsers` as the remediation command.

**Given** the dev server is not healthy after the target invokes the existing `start` path
**When** a developer runs `make test-e2e-dev`
**Then** the target exits non-zero
**And** the output identifies the dev server health precondition
**And** the output does not imply that the production stack is required.

**Given** `mockoon` is not reachable from the `dev` container
**When** a developer runs `make test-e2e-dev`
**Then** the target exits non-zero before or during the preflight phase
**And** the output identifies `mockoon` reachability as the unmet precondition
**And** the output points to the existing mock backend rather than a new mock service.

**Given** `FILE=` points to a path or glob matching zero specs
**When** a developer runs `make test-e2e-dev FILE=<missing-or-empty-pattern>`
**Then** the target exits non-zero
**And** the output allows Playwright's native zero-spec failure to remain visible.

**Given** a spec fails during execution
**When** Playwright exits non-zero
**Then** `make test-e2e-dev` exits non-zero
**And** the target does not replace the test failure with a generic precondition message.

**Given** precondition checks are implemented
**When** a developer inspects the Makefile and Playwright config changes
**Then** no hidden browser installation occurs inside `test-e2e-dev`
**And** no new Playwright dev service or mock service is introduced.

**Given** the README documents dev-mode e2e execution
**When** a developer reads the troubleshooting or testing guidance
**Then** the documentation lists the expected remediation for missing browsers, unhealthy dev server, unreachable `mockoon`, and zero matched specs.

## Epic 2: Dev Visual Smoke Workflow

Visual-regression authors can run fast dev-build visual checks without polluting production baselines, with separate dev snapshots, clear report tagging, and documented smoke-level semantics.

### Story 2.1: Isolate Dev Visual Snapshot Artifacts

As a visual-regression test author,
I want dev-mode visual snapshots stored separately from production baselines,
So that I can iterate quickly against the dev build without polluting CI-gated snapshot artifacts.

**Requirements covered:** FR16, FR17, FR18

**Acceptance Criteria:**

**Given** `PLAYWRIGHT_DEV_MODE=1` is present inside the container command
**When** `playwright.config.ts` resolves visual snapshot behavior
**Then** dev-mode visual snapshots are read from and written to `tests/visual/__snapshots__-dev/`
**And** production visual snapshot folders are not used for dev-mode output.

**Given** a developer runs a dev-mode visual test that creates or updates snapshots
**When** the run completes
**Then** no production visual baseline files are modified
**And** all dev-mode snapshot artifacts are written only under the dev snapshot location.

**Given** production-mode visual tests run through the existing `test-visual` target
**When** `PLAYWRIGHT_DEV_MODE` is absent
**Then** production visual snapshots continue to use the existing baseline locations
**And** existing production visual behavior is preserved.

**Given** Playwright reports a dev-mode visual run
**When** the report identifies the project or run context
**Then** the dev-mode run is tagged or named distinctly from production visual runs
**And** the distinction is visible enough for reviewers to identify dev-build results.

**Given** a developer needs to regenerate dev-mode visual baselines
**When** they use the documented dev-mode mechanism
**Then** only dev-mode snapshots are regenerated
**And** production-mode baselines remain unchanged.

**Given** implementation changes `playwright.config.ts`
**When** reviewers inspect the diff
**Then** there is still only one Playwright config file
**And** no `playwright.dev.config.ts` or equivalent duplicate config is introduced.

**Given** a developer reads the project testing documentation
**When** they look for visual-regression guidance
**Then** the README states that dev-mode visual snapshots are smoke-level and not CI-gating
**And** explains that authoritative baselines remain the production snapshots from `make test-visual`.

### Story 2.2: Run Dev Visual Smoke Tests from the Dev Container

As a visual-regression test author,
I want `make test-visual-dev` to run visual specs against the running dev server,
So that I can get fast smoke-level visual feedback during UI iteration.

**Requirements covered:** FR2, FR6

**Acceptance Criteria:**

**Given** Playwright browsers are installed
**And** the `dev` container is healthy
**And** dev visual snapshot isolation is configured
**When** a developer runs `make test-visual-dev`
**Then** Playwright runs the full visual suite from inside the existing `dev` container
**And** uses dev-mode visual snapshot locations
**And** exits zero when all visual specs pass.

**Given** a developer omits `FILE=`
**When** they run `make test-visual-dev`
**Then** Playwright runs the full visual suite
**And** no placeholder value is required.

**Given** a developer passes a single visual spec path
**When** they run `make test-visual-dev FILE=tests/visual/ui-button.spec.ts`
**Then** Playwright runs only the requested visual spec
**And** the command still executes inside the existing `dev` container.

**Given** a developer passes a quoted glob to `FILE=`
**When** they run `make test-visual-dev FILE='tests/visual/ui-*.spec.ts'`
**Then** the quoted value is forwarded safely to Playwright
**And** glob resolution is delegated to Playwright rather than host-shell expansion.

**Given** `make test-visual-dev` invokes Playwright from inside the `dev` container
**When** the command is inspected with `make -n test-visual-dev FILE='tests/visual/ui-*.spec.ts'`
**Then** the command uses `docker compose exec -T dev`
**And** sets `PLAYWRIGHT_DEV_MODE=1` inside the container command with `env`
**And** does not invoke `start-prod`.

**Given** a dev-mode visual spec fails
**When** Playwright exits non-zero
**Then** `make test-visual-dev` exits non-zero
**And** the wrapper does not mask the visual failure.

**Given** `FILE=` points to a path or glob matching zero visual specs
**When** Playwright reports zero matched tests
**Then** `make test-visual-dev` exits non-zero
**And** Playwright's native zero-spec failure remains visible.

**Given** the Makefile help output is generated
**When** a developer runs `make help`
**Then** `test-visual-dev` appears with a description no longer than 80 characters
**And** the description indicates dev-mode visual smoke execution
**And** labels the workflow as not CI-gating where practical.

**Given** a developer reads the project testing documentation
**When** they look for fast visual-regression workflow guidance
**Then** the README documents `make test-visual-dev`
**And** includes one full-suite example and one `FILE=` example
**And** states that dev-mode visual snapshots are smoke-level and not CI-gating.

## Epic 3: Interactive Dev Debugging

Developers can debug a single e2e spec interactively from the dev container using Playwright Inspector, `page.pause()`, REPL input, and host-accessible trace viewer ports.

### Story 3.1: Run a Single Dev E2E Spec in Interactive Debug Mode

As a frontend engineer debugging a flaky e2e spec,
I want `make test-e2e-dev-debug FILE=<spec>` to launch Playwright Inspector interactively,
So that I can use `page.pause()`, prompts, and REPL input from the dev container.

**Requirements covered:** FR9, FR12

**Acceptance Criteria:**

**Given** a developer omits `FILE=`
**When** they run `make test-e2e-dev-debug`
**Then** the target exits non-zero before launching Playwright
**And** the output states that `FILE=tests/e2e/...` is required for debug mode.

**Given** Playwright browsers are installed
**And** the `dev` container is healthy
**And** a valid e2e spec path is provided
**When** a developer runs `make test-e2e-dev-debug FILE=tests/e2e/auth-session.spec.ts`
**Then** Playwright launches the requested single spec in interactive debug mode
**And** the command runs from inside the existing `dev` container.

**Given** the debug target invokes Docker Compose
**When** the command is inspected with `make -n test-e2e-dev-debug FILE=tests/e2e/auth-session.spec.ts`
**Then** the command uses TTY-capable `docker compose exec dev`
**And** does not use `docker compose exec -T`
**And** does not use TTY-less helpers such as `EXEC_DEV_TTYLESS`, `BUN`, or `BUNX`.

**Given** debug mode is active
**When** the spec reaches `page.pause()` or an Inspector prompt
**Then** the developer can interact with Playwright Inspector
**And** REPL input is accepted through the allocated TTY.

**Given** `test-e2e-dev-debug` invokes Playwright from inside the `dev` container
**When** Playwright configuration resolves
**Then** `PLAYWRIGHT_DEV_MODE=1` is available inside the container command
**And** the debug run uses the same dev-mode base URL and project behavior as non-debug dev e2e runs.

**Given** the provided `FILE=` path or glob matches zero specs
**When** Playwright reports zero matched tests
**Then** `make test-e2e-dev-debug` exits non-zero
**And** Playwright's native failure remains visible.

**Given** a debugged spec fails
**When** Playwright exits non-zero
**Then** `make test-e2e-dev-debug` exits non-zero
**And** the wrapper does not mask the spec failure.

**Given** the Makefile help output is generated
**When** a developer runs `make help`
**Then** `test-e2e-dev-debug` appears with a concise description
**And** the description indicates that `FILE=` is required.

**Given** a developer reads the project testing documentation
**When** they look for e2e debugging guidance
**Then** the README documents `make test-e2e-dev-debug FILE=<real repo spec path>`
**And** explains that this target is interactive and single-spec only.

### Story 3.2: Expose and Configure the Dev Trace Viewer Port

As a frontend engineer inspecting Playwright traces,
I want trace viewer access on a documented host port,
So that I can open debugging output locally without conflicting with existing app ports.

**Requirements covered:** FR10, FR11, FR28

**Acceptance Criteria:**

**Given** the project uses the default debug configuration
**When** a dev-mode trace viewer is launched from the `dev` container
**Then** the trace viewer is reachable from the host on port `9323`
**And** the default does not conflict with `DEV_PORT=3000`, `PROD_PORT=3001`, or `GRAPHQL_PORT=4000`.

**Given** a developer sets `PLAYWRIGHT_TRACE_PORT=<custom-port>`
**When** they run `make test-e2e-dev-debug FILE=<spec>`
**Then** the trace viewer uses the custom host port
**And** the target does not require code changes to use that port.

**Given** trace viewer port exposure is configured
**When** reviewers inspect Docker Compose and Makefile changes
**Then** port exposure is scoped to the existing `dev` service
**And** no new Playwright dev service is introduced.

**Given** a developer inspects the Makefile
**When** they review the debug-related variables
**Then** `PLAYWRIGHT_TRACE_PORT ?= 9323` is present or equivalent defaulting behavior exists
**And** the variable is documented as user-overridable.

**Given** a developer runs `make -n test-e2e-dev-debug FILE=tests/e2e/auth-session.spec.ts`
**When** they inspect the rendered command
**Then** the command passes the trace-viewer port intent through the debug workflow
**And** preserves TTY-capable execution.

**Given** a developer reads the project testing documentation
**When** they look for trace viewer guidance
**Then** the README documents the default `http://localhost:9323` access path
**And** documents how to override the port with `PLAYWRIGHT_TRACE_PORT`.

**Given** the Makefile help output is generated
**When** a developer runs `make help`
**Then** the debug target or nearby help text makes trace viewer access discoverable
**And** does not imply that trace viewer behavior is part of CI.

## Epic 4: Safe Adoption, Compatibility, and Discoverability

Platform maintainers and downstream template consumers can adopt the new dev-mode targets without breaking existing Playwright workflows, leaking dev-mode config, exposing isolated services, or losing documentation clarity.

### Story 4.1: Preserve Production-Parity Playwright Workflows

As a platform maintainer,
I want the existing Playwright Makefile targets and CI workflows preserved,
So that downstream repos can adopt the dev-mode targets without breaking production-parity testing.

**Requirements covered:** FR20, FR23

**Acceptance Criteria:**

**Given** the implementation adds dev-mode Playwright targets
**When** reviewers compare the bodies of `test-e2e`, `test-e2e-ui`, `test-visual`, `test-visual-ui`, and `test-visual-update`
**Then** those five existing target bodies are byte-identical to their pre-change versions
**And** no whitespace, comment, dependency, or command changes are introduced inside those target bodies.

**Given** the production-parity Playwright targets are invoked
**When** a developer runs `make test-e2e`, `make test-e2e-ui`, `make test-visual`, `make test-visual-ui`, or `make test-visual-update`
**Then** each target follows its existing production-parity execution path
**And** none of them requires `PLAYWRIGHT_DEV_MODE`.

**Given** CI workflows exist in the repository
**When** reviewers inspect `.github/workflows/`
**Then** no workflow invokes `test-e2e-dev`, `test-visual-dev`, `test-e2e-dev-debug`, or `ensure-playwright-browsers`
**And** no dev-mode target is added as a CI gate.

**Given** `PLAYWRIGHT_DEV_MODE` is absent
**When** production-mode Playwright configuration resolves
**Then** the existing production-oriented base URL, project list, and snapshot behavior are preserved
**And** production visual baselines remain authoritative.

**Given** downstream repos sync this template
**When** they compare the Makefile diff
**Then** new dev-mode behavior appears as additive target and variable changes
**And** the existing production-parity target bodies remain stable for template-sync consumers.

**Given** project checks are run after implementation
**When** maintainers run the repository lint/check target
**Then** new Makefile, Docker, Playwright config, and documentation changes pass without suppressions
**And** existing production-parity tests are not skipped to make the change pass.

### Story 4.2: Enforce Dev-Mode Isolation Boundaries

As a platform maintainer,
I want dev-mode configuration and Docker network access scoped only to the new local workflows,
So that IDE, CI, production-parity targets, and isolated services keep their existing behavior.

**Requirements covered:** FR20, FR22

**Acceptance Criteria:**

**Given** dev-mode Playwright targets are implemented
**When** reviewers inspect the Makefile, Dockerfile, Docker Compose files, and Playwright config
**Then** `PLAYWRIGHT_DEV_MODE` is set only inside the new dev-mode Make recipe commands
**And** it is not set as a Dockerfile `ENV`, Compose `environment` entry, top-level Makefile assignment, CI variable, or persistent shell setting.

**Given** a developer starts an interactive shell with the existing shell target
**When** they inspect the shell environment
**Then** `PLAYWRIGHT_DEV_MODE` is absent
**And** default Playwright config resolution remains production-oriented.

**Given** the VS Code Playwright Test extension runs without dev-mode Make targets
**When** it resolves Playwright configuration
**Then** it does not inherit `PLAYWRIGHT_DEV_MODE`
**And** it continues to use production-oriented default configuration.

**Given** `mockoon` must be reachable from the `dev` container
**When** Docker Compose network changes are applied
**Then** `mockoon` is reachable from `dev` on the intended network
**And** no new mock service is introduced.

**Given** `prod` and `playwright` are production-parity test services
**When** Docker Compose network topology is inspected after implementation
**Then** `prod` and `playwright` are not exposed on the dev network
**And** they cannot be mistakenly reached from the `dev` container.

**Given** reviewers inspect the final Docker Compose diff
**When** they compare service definitions
**Then** network changes are limited to the minimum needed for `dev` to reach `mockoon`
**And** no new Playwright dev service is introduced.

**Given** documentation describes dev-mode execution
**When** a developer reads the README or `CLAUDE.md`
**Then** it states that dev-mode targets are local-only
**And** explains that production-parity targets and CI keep their existing behavior.

### Story 4.3: Finalize Discoverability and Operator Documentation

As a developer or downstream template consumer,
I want the new dev-mode workflows documented and visible in `make help`,
So that I can choose the right target without reading implementation details.

**Requirements covered:** FR24, FR25

**Acceptance Criteria:**

**Given** the Makefile help output is generated
**When** a developer runs `make help`
**Then** `test-e2e-dev`, `test-visual-dev`, `test-e2e-dev-debug`, and `ensure-playwright-browsers` all appear
**And** each description is concise, no longer than 80 characters where Makefile formatting allows
**And** each description clearly identifies the target's dev-mode purpose.

**Given** a developer wants to run one e2e spec quickly
**When** they read the README testing section
**Then** it includes a runnable example using `make test-e2e-dev FILE=<real repo spec path>`
**And** the example is placed alongside the existing Playwright documentation.

**Given** a developer wants to run visual checks quickly
**When** they read the README testing section
**Then** it includes `make test-visual-dev` usage
**And** states that dev-mode visual snapshots are smoke-level and not CI-gating
**And** clarifies that authoritative snapshots come from production-mode `make test-visual`.

**Given** a developer wants to debug one e2e spec
**When** they read the README testing section
**Then** it includes `make test-e2e-dev-debug FILE=<real repo spec path>`
**And** explains that the debug target is interactive and requires `FILE=`.

**Given** a developer needs trace viewer access
**When** they read the debugging documentation
**Then** it documents the default `http://localhost:9323` trace viewer path
**And** explains how to override it with `PLAYWRIGHT_TRACE_PORT`.

**Given** a developer hits a dev-mode precondition failure
**When** they consult README or `CLAUDE.md`
**Then** documentation includes remediation guidance for missing browsers, unhealthy dev server, unreachable `mockoon`, and zero matched specs.

**Given** a downstream template consumer reviews the docs
**When** they compare dev-mode and production-parity targets
**Then** the docs clearly state that `test-e2e` and `test-visual` remain the CI/production-parity paths
**And** `-dev` targets are local fast-feedback workflows.

**Given** implementation is complete
**When** reviewers inspect documentation diffs
**Then** no documentation claims dev-mode visual snapshots are authoritative
**And** no documentation instructs adding dev-mode targets to CI.
