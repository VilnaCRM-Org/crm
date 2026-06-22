# Story 1.1: Install Playwright Browsers for Dev Runs

Status: done

## Story

As a frontend engineer,
I want an explicit Makefile target to install or verify Playwright browsers inside the dev container,
so that dev-mode Playwright runs can execute without hidden setup or image-size cost by default.

## Acceptance Criteria

1. The default dev image build installs no Playwright browsers and stays within the NFR8 image-size
   budget (FR13, NFR8, NFR13).
2. Building the dev image with `INSTALL_PLAYWRIGHT_BROWSERS=true` installs the pinned system apk
   Chromium (the same Alpine-compatible build used for Lighthouse), with no Firefox or WebKit for
   dev-mode scope (FR13).
3. `make ensure-playwright-browsers` installs Chromium inside the running dev container, exits zero on
   success, and reports that browsers are ready (FR14).
4. Re-running `make ensure-playwright-browsers` when Chromium is already installed exits zero without
   re-installing and completes within the NFR3 idempotent budget (FR15).
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
  - [x] 1.2 Fold `INSTALL_PLAYWRIGHT_BROWSERS=true` into the existing apk Chromium install (shared
        with `INSTALL_CHROMIUM`) so the build installs the system Chromium packages, not a glibc
        download that cannot run on Alpine.
  - [x] 1.3 Leave the rust-code-analysis stage untouched so the rca-stage golden test is unaffected.
  - [x] 1.4 Wire the build arg through `docker-compose.yml` on the `dev` service as
        `INSTALL_PLAYWRIGHT_BROWSERS: ${INSTALL_PLAYWRIGHT_BROWSERS:-false}`.

- [x] Task 2: Add the idempotent ensure-playwright-browsers target (AC: 3, 4, 6)
  - [x] 2.1 Add `INSTALL_PLAYWRIGHT_BROWSERS ?= false` next to `INSTALL_CHROMIUM` in the Makefile.
  - [x] 2.2 Implement `ensure-playwright-browsers: ensure-chromium`, reusing the repo's idempotent
        apk Chromium install (it skips when `/usr/bin/chromium-browser` already exists).
  - [x] 2.3 Echo a "Chromium is ready" confirmation on success.
  - [x] 2.4 Give the target a `##` help string so it surfaces in `make help` within 72 chars.

- [x] Task 3: Add the fail-fast browser preflight (AC: 5)
  - [x] 3.1 Implement `require-playwright-browsers: ensure-dev` as an internal helper with no `##`
        comment so it stays hidden from `make help`.
  - [x] 3.2 Probe `[ -x /usr/bin/chromium-browser ]` (`CHROMIUM_BIN_PATH`) inside the dev container;
        on absence print the remediation message to stderr and exit 1.
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
- **Alpine-compatible system Chromium (review-driven):** Dev-mode uses the system apk Chromium at
  `/usr/bin/chromium-browser`, not Playwright's bundled download. Playwright's Chromium is glibc-linked
  and cannot launch on the Alpine (musl) dev image (flagged by the cubic reviewer as a P0), so
  `ensure-playwright-browsers` reuses the existing `ensure-chromium` apk install (idempotent: it skips
  when the binary is present) and the `chromium-dev` Playwright project sets
  `launchOptions.executablePath` to that binary. This is the apk alternative the PRD's `R-chromium-pin`
  risk anticipated.
- **Fail-fast preflight, not silent install:** A separate internal `require-playwright-browsers`
  helper checks `[ -x /usr/bin/chromium-browser ]` and exits non-zero with remediation text rather than
  installing Chromium implicitly. This keeps provisioning explicit and opt-in; the three dev-mode
  targets depend on it so they never silently install browsers.
- **Ordering under parallel make:** `require-playwright-browsers` depends on `ensure-dev` and
  `ensure-playwright-browsers` depends on `ensure-chromium` (which itself brings the dev service up),
  so the dev container is live before either the preflight check or the apk install runs, even under
  parallel make.
- **Chromium-only dev scope:** Provisioning installs Chromium alone, matching the single
  `chromium-dev` Playwright project used by dev-mode runs; no Firefox or WebKit is installed.
- **rca stage untouched:** Only the base stage of the Dockerfile changed, so
  `tests/unit/performance/dockerfile-rca-stage.test.js` (which inspects the rca stage only) is
  unaffected.

### Project Structure Notes

- **Primary files:** `Dockerfile` (base-stage build arg folded into the apk Chromium install),
  `docker-compose.yml` (dev-service build arg), `Makefile` (`INSTALL_PLAYWRIGHT_BROWSERS` var,
  `ensure-playwright-browsers`, `require-playwright-browsers`), `playwright.config.ts`
  (`chromium-dev` `executablePath`), `README.md`, `CLAUDE.md`.
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

- `make -n ensure-playwright-browsers`: resolves to the `ensure-chromium` apk install
  (`apk add --no-cache chromium=136.0.7103.113-r0 ...`); success message echoed.
- `make -n test-e2e-dev` / `test-visual-dev` / `test-e2e-dev-debug`: each depends on
  `ensure-dev wait-for-dev wait-for-mockoon require-playwright-browsers`; the preflight
  precedes the Playwright invocation.
- `require-playwright-browsers` recipe checks `[ -x /usr/bin/chromium-browser ]` in the dev
  container and on absence prints "Chromium is not installed in the dev container." plus
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
- Browser strategy (review-driven): dev-mode uses the system apk Chromium at
  `/usr/bin/chromium-browser` (the Alpine-compatible build already used for Lighthouse), not
  Playwright's glibc download — addressing the cubic P0. The `chromium-dev` project sets
  `launchOptions.executablePath` to that binary.
- Honest runtime-verification caveat: a live apk install and a full live e2e/visual run were NOT
  executed in this environment (the dev container has no outbound network here). The acceptance bar
  for this story — `make -n` wiring plus correct remediation text — is met; no green browser run is
  claimed.

### File List

- `Dockerfile`
- `docker-compose.yml`
- `Makefile`
- `playwright.config.ts`
- `README.md`
- `CLAUDE.md`
- `specs/makefile-playwright-targets/implementation-artifacts/1-1-install-playwright-browsers-for-dev-runs.md`
