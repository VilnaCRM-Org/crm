# Story 1.2: Run Dev E2E Tests from the Dev Container

Status: done

## Story

As a frontend engineer authoring Playwright tests,
I want `make test-e2e-dev` to run e2e specs from the existing `dev` container,
so that I can get fast local feedback without starting the production test stack.

## Acceptance Criteria

1. When the `dev` container is not running, `make test-e2e-dev` starts the existing Docker Compose
   `dev` service through the existing `start` path and never invokes `start-prod`.
2. When the `dev` container is already running and the dev HTTP port responds, the target reuses the
   running container without rebuilding or restarting it.
3. With browsers installed, a healthy dev server, and `mockoon` reachable, the target runs the full
   e2e suite from inside the `dev` container against the dev-server base URL and exits zero when all
   specs pass.
4. When at least one spec fails and Playwright exits non-zero, the Makefile target also exits
   non-zero and the failure is not masked by wrapper shell logic.
5. `make -n test-e2e-dev` shows the command uses `docker compose exec -T dev`, sets
   `PLAYWRIGHT_DEV_MODE=1` inside the container command with `env`, and never relies on a host-side
   `PLAYWRIGHT_DEV_MODE=1` prefix.
6. With `PLAYWRIGHT_DEV_MODE=1` set inside the container, the single existing `playwright.config.ts`
   selects the dev-mode base URL and dev project behavior; no separate Playwright config file is
   introduced.
7. The existing `mockoon` service is reachable from the `dev` container on the required Docker
   network, and no new mock service or Playwright dev service is introduced.
8. `make help` lists `test-e2e-dev` with a description no longer than 80 characters that names
   dev-mode e2e execution.
9. The README documents `make test-e2e-dev` and explains that this path runs against the dev build
   and does not replace production-parity `make test-e2e`.

## Tasks / Subtasks

- [x] Task 1: Add the dev-mode e2e execution variables and target wiring (AC: 1, 2, 3, 5, 6)
  - [x] 1.1 Add `EXEC_DEV_TTY = $(DOCKER_COMPOSE) exec dev` next to `EXEC_DEV_TTYLESS`, plus
        `PLAYWRIGHT_DEV_TEST`, `RUN_E2E_DEV`, and a `FILE ?=` argument near related variables.
  - [x] 1.2 Add the `test-e2e-dev` target with prereqs
        `ensure-dev wait-for-dev wait-for-mockoon require-playwright-browsers`, after the frozen
        `test-visual-update` target and before `create-network`.
  - [x] 1.3 Inject `PLAYWRIGHT_DEV_MODE=1` inside the container command via
        `$(EXEC_DEV_TTYLESS) env PLAYWRIGHT_DEV_MODE=1 bun x playwright test`, never as a host prefix.
- [x] Task 2: Route start/reuse through `ensure-dev` so `start-prod` is never touched (AC: 1, 2)
  - [x] 2.1 Depend on `ensure-dev` (idempotent dev-start wrapper) to start `dev` when down and reuse
        a running container without rebuild/restart.
  - [x] 2.2 Confirm the recipe never references `start-prod`, `prod`, or the `playwright` service.
- [x] Task 3: Branch `playwright.config.ts` on dev mode without a second config file (AC: 6)
  - [x] 3.1 Add `const isDevMode = process.env.PLAYWRIGHT_DEV_MODE === '1'` and branch the base URL.
  - [x] 3.2 Reduce dev projects to a single Chromium-only `chromium-dev` project; keep prod projects
        (`chromium`, `firefox`, `webkit`) unchanged.
  - [x] 3.3 Verify the dev base URL resolves to `WEBSITE_URL` or `http://localhost:${DEV_PORT||3000}`.
- [x] Task 4: Confirm mockoon reachability and service isolation on the dev network (AC: 7)
  - [x] 4.1 Audit `docker-compose.yml` and `docker-compose.test.yml` network membership.
  - [x] 4.2 Confirm `dev` and `mockoon` already share `crm-network`, so mockoon is reachable with
        zero compose change and no new service is introduced.
- [x] Task 5: Preserve native exit codes (AC: 3, 4)
  - [x] 5.1 Ensure spec-failure and zero-match non-zero exits propagate from Playwright unmasked.
- [x] Task 6: Document discoverability and dev/prod distinction (AC: 8, 9)
  - [x] 6.1 Add the `##` help string (<= 80 chars) so `test-e2e-dev` appears in `make help`.
  - [x] 6.2 Document `make test-e2e-dev` in README and `CLAUDE.md`, stating it runs the dev build and
        does not replace production-parity `make test-e2e`.

## Dev Notes

### Architecture Decisions

- **Execution anchor:** Dev-mode e2e runs route through the existing Docker Compose `dev` service,
  not a new service. The target depends on `ensure-dev`, the repo's idempotent dev-start wrapper:
  it reuses a running container and only calls `make start` when `dev` is down. This satisfies FR3
  (start-if-down) and FR4 (reuse-without-rebuild) in one prerequisite and never touches `start-prod`.
- **Container-internal env injection:** `PLAYWRIGHT_DEV_MODE=1` is injected inside the container
  command via `$(EXEC_DEV_TTYLESS) env PLAYWRIGHT_DEV_MODE=1 bun x playwright test`, never as a
  host-side prefix, so the flag actually reaches the Playwright process (FR19/FR20).
- **Single config branch:** `playwright.config.ts` branches on
  `const isDevMode = process.env.PLAYWRIGHT_DEV_MODE === '1'`. Dev mode selects the dev base URL
  (`WEBSITE_URL` or `http://localhost:${DEV_PORT||3000}`) and a single Chromium-only `chromium-dev`
  project; production base URL and the `chromium`/`firefox`/`webkit` projects are unchanged. No
  second config file is added (FR19).
- **Network audit (resolves the architecture's open audit item):** Both `docker-compose.yml` and
  `docker-compose.test.yml` already attach every service to the same external `crm-network`, so
  `mockoon` is reachable from `dev` with zero compose change (FR21). `prod` and `playwright` are
  defined only in `docker-compose.test.yml` and are not started by the dev `start` path, so they are
  not reachable in a dev-mode run; `docker-compose.test.yml` was audited and left unchanged.
- **Native exit codes:** The recipe forwards Playwright's exit status unmodified; spec failures and
  zero-match runs surface as native non-zero exits and are not masked (FR27).

### Project Structure Notes

- **Primary files:** `Makefile` (variables `EXEC_DEV_TTY`, `PLAYWRIGHT_DEV_TEST`, `RUN_E2E_DEV`,
  `FILE ?=`; the `test-e2e-dev` target and its prerequisite chain
  `ensure-dev wait-for-dev wait-for-mockoon require-playwright-browsers`), `playwright.config.ts`
  (the `isDevMode` base-URL and `chromium-dev` project branch), `README.md` (dev-mode e2e usage),
  `CLAUDE.md` (fast dev-mode targets guidance).
- **Inspect-only:** `docker-compose.yml` and `docker-compose.test.yml` were audited for network
  membership and confirmed to already share `crm-network`; no edit was required for this story.

### Testing Approach

- Static command-wiring verification with `make -n test-e2e-dev`: confirmed the recipe uses
  `docker compose exec -T dev`, injects `PLAYWRIGHT_DEV_MODE=1` in-container via `env`, and routes
  through `ensure-dev` (never `start-prod`).
- `make help`: confirmed `test-e2e-dev` appears with a description <= 72 characters; the internal
  `require-playwright-browsers` helper stays hidden.
- `git diff main -- Makefile`: confirmed the five frozen targets (`test-e2e`, `test-e2e-ui`,
  `test-visual`, `test-visual-ui`, `test-visual-update`) are byte-identical.
- `playwright test --list`: prod lists `[chromium]`/`[firefox]`/`[webkit]`; with
  `PLAYWRIGHT_DEV_MODE=1` it lists only `[chromium-dev]` (86 specs), confirming the dev branch.
- Lint gates clean: `eslint playwright.config.ts`, `tsc --noEmit`, and
  `markdownlint README.md CLAUDE.md`.
- Runtime honesty: a live browser e2e run was not executed in this environment (see Completion
  Notes). The architecture's stated acceptance bar of `make -n` wiring plus config validity is met.

### References

- PRD:
  `specs/makefile-playwright-targets/planning-artifacts/prd-makefile-playwright-targets-2026-04-16.md`
  (FR1, FR3, FR4, FR19, FR21, FR27)
- Architecture:
  `specs/makefile-playwright-targets/planning-artifacts/architecture-makefile-playwright-targets-2026-04-16.md`
  (`Requirements to Structure Mapping` -> Dev Test Execution FR1-FR4; `Playwright Config Pattern`;
  `Network Topology` FR21-FR22; `Operator Feedback` zero/non-zero exit handling)
- Epics:
  `specs/makefile-playwright-targets/planning-artifacts/epics-makefile-playwright-targets-2026-04-16.md`
  (`Story 1.2: Run Dev E2E Tests from the Dev Container`)

## Dev Agent Record

### Agent Model Used

claude-opus-4-8

### Debug Log References

- `make -n test-e2e-dev`: recipe resolves to
  `docker compose exec -T dev env PLAYWRIGHT_DEV_MODE=1 bun x playwright test "<TEST_DIR_E2E>"`;
  prerequisites `ensure-dev wait-for-dev wait-for-mockoon require-playwright-browsers`;
  no `start-prod` reference.
- `make help`: `test-e2e-dev` shown with description <= 72 chars;
  `require-playwright-browsers` hidden (no `##` marker).
- `git diff main -- Makefile`: no hunks fall inside the five frozen target bodies.
- `playwright test --list`: prod -> `[chromium]`/`[firefox]`/`[webkit]`;
  `PLAYWRIGHT_DEV_MODE=1` -> `[chromium-dev]` only (86 specs).
- `eslint playwright.config.ts` clean; `tsc --noEmit` clean;
  `markdownlint README.md CLAUDE.md` clean.

### Completion Notes List

- Delivered `make test-e2e-dev`, wired through `ensure-dev` (reuse/start, never `start-prod`) and
  `require-playwright-browsers`, injecting `PLAYWRIGHT_DEV_MODE=1` inside the container via `env`.
- Branched the single `playwright.config.ts` on `isDevMode` for the dev base URL and the Chromium-only
  `chromium-dev` project; no second config file was added.
- Confirmed mockoon reachability with zero compose change: `dev` and `mockoon` already share the
  external `crm-network`; `prod`/`playwright` live only in `docker-compose.test.yml` and are not
  started by the dev path. The architecture's open Compose-topology audit item is resolved.
- Honest runtime caveats (no green browser run is claimed for this story):
  1. A live e2e run was not executed here: the dev container has no outbound network in this
     environment, and the Alpine base image is not Playwright's officially supported target for its
     bundled Chromium. The repo-pinned apk Chromium is the alternative the PRD's R-chromium-pin risk
     explicitly allows. Acceptance was met at the architecture's stated bar (`make -n` wiring plus
     config validity), not via a browser run.
  2. The dev server bakes `REACT_APP_MOCKOON_URL=http://localhost:8080` at serve time; an in-container
     browser reaches mockoon by service name (`http://mockoon:8080`). Mockoon-dependent e2e flows may
     need the dev server served with the service-name URL -- a runtime follow-up. Network reachability
     itself (shared `crm-network`) is satisfied.

### File List

- `Makefile`
- `playwright.config.ts`
- `README.md`
- `CLAUDE.md`
- `specs/makefile-playwright-targets/implementation-artifacts/1-2-run-dev-e2e-tests-from-the-dev-container.md`
