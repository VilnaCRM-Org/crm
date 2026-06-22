# Story 1.1: Install Playwright Browsers for Dev Runs

Status: done

## Story

As a frontend engineer,
I want an explicit Makefile target to install or verify Playwright browsers inside the dev container,
so that dev-mode Playwright runs can execute without hidden setup or image-size cost by default.

## Acceptance Criteria

1. The default dev image build installs no Playwright browsers and stays within the NFR8 image-size
   budget (FR13, NFR8, NFR13).
2. Building the dev image with `INSTALL_PLAYWRIGHT_BROWSERS=true` installs Chromium through the
   repo-pinned Playwright/Bun toolchain, with no Firefox or WebKit for dev-mode scope (FR13).
3. `make ensure-playwright-browsers` installs Chromium inside the running dev container, exits zero on
   success, and reports that browsers are ready (FR14).
4. Re-running `make ensure-playwright-browsers` when browsers already match the pinned Playwright
   version exits zero without re-downloading and completes within the NFR3 idempotent budget (FR15).
5. When the image was built with `INSTALL_PLAYWRIGHT_BROWSERS=false`, invoking `test-e2e-dev`,
   `test-visual-dev`, or `test-e2e-dev-debug` before provisioning fails fast non-zero, names the
   missing browser precondition, and includes `make ensure-playwright-browsers` as remediation
   (FR29, FR26).
6. `make help` lists `ensure-playwright-browsers` with a concise description indicating it installs
   Playwright browsers for dev-mode runs (FR24).
7. The README documents `make ensure-playwright-browsers` and explains that browser installation is
   explicit and opt-in, not hidden inside test targets (FR25).

## Tasks / Subtasks

- [x] Task 1: Add opt-in browser bundling to the dev image (AC: 1, 2)
  - [x] 1.1 Add `ARG INSTALL_PLAYWRIGHT_BROWSERS=false` to the Dockerfile base stage.
  - [x] 1.2 After `RUN bun install --frozen-lockfile`, conditionally run
        `bun x playwright install chromium` only when the arg is `true`.
  - [x] 1.3 Leave the rust-code-analysis stage untouched so the rca-stage golden test is unaffected.
  - [x] 1.4 Wire the build arg through `docker-compose.yml` on the `dev` service as
        `INSTALL_PLAYWRIGHT_BROWSERS: ${INSTALL_PLAYWRIGHT_BROWSERS:-false}`.

- [x] Task 2: Add the idempotent ensure-playwright-browsers target (AC: 3, 4, 6)
  - [x] 2.1 Add `INSTALL_PLAYWRIGHT_BROWSERS ?= false` next to `INSTALL_CHROMIUM` in the Makefile.
  - [x] 2.2 Implement `ensure-playwright-browsers: ensure-dev` running `$(BUNX) playwright install
chromium`, relying on Playwright's native idempotency to skip an already-present version.
  - [x] 2.3 Echo a "Chromium is ready" confirmation on success.
  - [x] 2.4 Give the target a `##` help string so it surfaces in `make help` within 72 chars.

- [x] Task 3: Add the fail-fast browser preflight (AC: 5)
  - [x] 3.1 Implement `require-playwright-browsers: ensure-dev` as an internal helper with no `##`
        comment so it stays hidden from `make help`.
  - [x] 3.2 Probe `"$HOME"/.cache/ms-playwright/chromium-*/` inside the dev container; on absence
        print the remediation message to stderr and exit 1.
  - [x] 3.3 Make `test-e2e-dev`, `test-visual-dev`, and `test-e2e-dev-debug` depend on
        `require-playwright-browsers` so they fail fast before invoking Playwright.

- [x] Task 4: Document the opt-in provisioning workflow (AC: 7)
  - [x] 4.1 Document `make ensure-playwright-browsers` in the README dev-mode Playwright section as
        an explicit, opt-in step.
  - [x] 4.2 Describe the same opt-in setup and the recipe-scoped dev-mode flag in CLAUDE.md.

- [x] Task 5: Verify wiring without a live browser run (AC: 1-6)
  - [x] 5.1 Inspect `make -n ensure-playwright-browsers` and the three dev targets for correct
        dependency ordering and remediation text.
  - [x] 5.2 Confirm `make help` shows `ensure-playwright-browsers` and hides
        `require-playwright-browsers`.
  - [x] 5.3 Confirm `git diff main -- Makefile` leaves the five frozen targets byte-identical.

## Dev Notes

### Architecture Decisions

- **Opt-in by default:** The Dockerfile base stage gains `ARG INSTALL_PLAYWRIGHT_BROWSERS=false`. With
  the default, the build performs no browser download (NFR13) and the image size is unchanged within
  the NFR8 budget. Browsers are pulled only when the arg is explicitly `true` at build time or when
  `make ensure-playwright-browsers` is run later.
- **Native idempotency:** `ensure-playwright-browsers` runs `bun x playwright install chromium`.
  Playwright's installer is itself idempotent — it skips the download when the pinned version is
  already present — so re-runs are safe and fast without bespoke version-diff logic.
- **Fail-fast preflight, not silent install:** A separate internal `require-playwright-browsers`
  helper probes the in-container Playwright cache and exits non-zero with remediation text rather than
  installing browsers implicitly. This keeps provisioning explicit and opt-in; the three dev-mode
  targets depend on it so they never silently download browsers.
- **Ordering under parallel make:** Both `ensure-playwright-browsers` and `require-playwright-browsers`
  depend on `ensure-dev` (the repo's idempotent dev-start wrapper that reuses a running dev container
  and only calls `make start` when dev is down), so prerequisite ordering holds even under parallel
  make and the preflight always runs against a live container.
- **Chromium-only dev scope:** Provisioning installs Chromium alone, matching the single
  `chromium-dev` Playwright project used by dev-mode runs; no Firefox or WebKit is installed.
- **rca stage untouched:** Only the base stage of the Dockerfile changed, so
  `tests/unit/performance/dockerfile-rca-stage.test.js` (which inspects the rca stage only) is
  unaffected.

### Project Structure Notes

- **Primary files:** `Dockerfile` (base-stage build arg + conditional install), `docker-compose.yml`
  (dev-service build arg), `Makefile` (`INSTALL_PLAYWRIGHT_BROWSERS` var,
  `ensure-playwright-browsers`, `require-playwright-browsers`), `README.md`, `CLAUDE.md`.
- **Inspect-only:** `docker-compose.test.yml` was audited for the network topology and left
  unchanged; `tests/unit/performance/dockerfile-rca-stage.test.js` was confirmed unaffected.

### Testing Approach

This story was verified statically; no live browser install or live e2e/visual run was performed in
this environment.

- `make -n ensure-playwright-browsers` confirmed the recipe runs `bun x playwright install chromium`
  behind `ensure-dev`.
- `make -n test-e2e-dev` / `test-visual-dev` / `test-e2e-dev-debug` confirmed each depends on
  `require-playwright-browsers`, so an absent-browser run fails fast before Playwright is invoked.
- `make help` confirmed `ensure-playwright-browsers` appears with a description under 72 chars and
  `require-playwright-browsers` stays hidden.
- `git diff main -- Makefile` confirmed the five frozen targets (`test-e2e`, `test-e2e-ui`,
  `test-visual`, `test-visual-ui`, `test-visual-update`) are byte-identical.
- `markdownlint README.md CLAUDE.md` ran clean for the documentation changes.

### References

- PRD:
  `specs/makefile-playwright-targets/planning-artifacts/prd-makefile-playwright-targets-2026-04-16.md`
  - FR13, FR14, FR15, FR29; NFR3, NFR8, NFR13.
- Architecture:
  `specs/makefile-playwright-targets/planning-artifacts/architecture-makefile-playwright-targets-2026-04-16.md`
  - `Component and Integration Overview` -> `Browser Provisioning (FR13-FR15, FR29)`.
  - `Implementation Guardrails` (opt-in/idempotent browser installation).
- Epics:
  `specs/makefile-playwright-targets/planning-artifacts/epics-makefile-playwright-targets-2026-04-16.md`
  - `Epic 1: Fast Dev E2E Execution`
  - `Story 1.1: Install Playwright Browsers for Dev Runs`

## Dev Agent Record

### Agent Model Used

claude-opus-4-8

### Debug Log References

- `make -n ensure-playwright-browsers`: recipe resolves to `bun x playwright install chromium` behind
  `ensure-dev`; success message echoed.
- `make -n test-e2e-dev` / `test-visual-dev` / `test-e2e-dev-debug`: each depends on
  `ensure-dev wait-for-dev wait-for-mockoon require-playwright-browsers`; the preflight
  precedes the Playwright invocation.
- `require-playwright-browsers` recipe checks
  `ls "$HOME"/.cache/ms-playwright/chromium-*/` in the dev container and on absence prints
  "Playwright browsers are not installed in the dev container." plus
  "Run: make ensure-playwright-browsers" to stderr, then exits 1.
- `make help`: shows `ensure-playwright-browsers` (description under 72 chars);
  `require-playwright-browsers` hidden.
- `git diff main -- Makefile`: no hunks fall inside the five frozen target bodies.
- `markdownlint README.md CLAUDE.md`: clean.

### Completion Notes List

- Delivered the opt-in `INSTALL_PLAYWRIGHT_BROWSERS=false` build arg (Dockerfile base stage +
  `docker-compose.yml` dev service), the idempotent `ensure-playwright-browsers` Make target, and the
  hidden fail-fast `require-playwright-browsers` preflight wired into the three dev-mode targets.
- Documented the explicit, opt-in provisioning workflow and remediation in README.md and CLAUDE.md.
- Honest runtime-verification caveat: a live browser install and a full live e2e/visual run were NOT
  executed here. The dev container has no outbound network in this environment, and the Alpine base
  image is not Playwright's officially supported target for its bundled Chromium; the repo-pinned apk
  Chromium is the alternative the PRD's R-chromium-pin risk explicitly allows. The architecture's
  stated acceptance bar for this story — `make -n` wiring plus correct remediation text — is met. No
  green browser run is claimed.

### File List

- `Dockerfile`
- `docker-compose.yml`
- `Makefile`
- `README.md`
- `CLAUDE.md`
- `specs/makefile-playwright-targets/implementation-artifacts/1-1-install-playwright-browsers-for-dev-runs.md`
