# Story 3.1: Run a Single Dev E2E Spec in Interactive Debug Mode

Status: done

## Story

As a frontend engineer debugging a flaky e2e spec,
I want `make test-e2e-dev-debug FILE=<spec>` to launch Playwright Inspector interactively,
so that I can use `page.pause()`, prompts, and REPL input from the dev container.

## Acceptance Criteria

1. Running `make test-e2e-dev-debug` without `FILE=` exits non-zero before launching Playwright
   and the output states that `FILE=tests/e2e/...` is required for debug mode.
2. With browsers installed, a healthy `dev` container, and a valid spec path,
   `make test-e2e-dev-debug FILE=<spec>` launches that single spec in interactive debug mode from
   inside the existing `dev` container.
3. `make -n test-e2e-dev-debug FILE=<spec>` shows TTY-capable `docker compose exec dev`, with no
   `-T` flag and no TTY-less helper (`EXEC_DEV_TTYLESS`, `BUN`, or `BUNX`).
4. In debug mode the developer can interact with Playwright Inspector at `page.pause()` and Inspector
   prompts, and REPL input is accepted through the allocated TTY.
5. `PLAYWRIGHT_DEV_MODE=1` is available inside the container command, so the debug run uses the same
   dev-mode base URL and project behavior as non-debug dev e2e runs.
6. When the provided `FILE=` path or glob matches zero specs, the target exits non-zero and
   Playwright's native failure remains visible.
7. When a debugged spec fails, `make test-e2e-dev-debug` exits non-zero and the wrapper does not
   mask the spec failure.
8. `test-e2e-dev-debug` appears in `make help` with a concise description indicating that `FILE=` is
   required.
9. The README documents `make test-e2e-dev-debug FILE=<real repo spec path>` and explains that the
   target is interactive and single-spec only.

## Tasks / Subtasks

- [x] Task 1: Add the `EXEC_DEV_TTY` execution helper and debug variables (AC: 3, 5)
  - [x] 1.1 Add `EXEC_DEV_TTY = $(DOCKER_COMPOSE) exec dev` next to `EXEC_DEV_TTYLESS` (no `-T`).
  - [x] 1.2 Add `PLAYWRIGHT_TRACE_PORT ?= 9323` next to the other port variables.
  - [x] 1.3 Add the optional `FILE ?=` single-spec/glob argument.

- [x] Task 2: Implement the `test-e2e-dev-debug` target (AC: 1, 2, 3, 5)
  - [x] 2.1 Depend on `ensure-dev` and `require-playwright-browsers` so the dev container is up and
        browsers are present before debug starts.
  - [x] 2.2 Require `FILE`: first recipe line guards with
        `@[ -n "$(FILE)" ] || { printf "❌ FILE= is required ..."; exit 1; }`.
  - [x] 2.3 Run the debug command via TTY-capable `$(EXEC_DEV_TTY) env PLAYWRIGHT_DEV_MODE=1
PLAYWRIGHT_TRACE_PORT=$(PLAYWRIGHT_TRACE_PORT) bun x playwright test "$(FILE)" --debug`.

- [x] Task 3: Preserve native Playwright exit behavior (AC: 6, 7)
  - [x] 3.1 Pass only the quoted `"$(FILE)"` to Playwright; do not append the test dir as well.
  - [x] 3.2 Do not wrap the Playwright invocation in any masking shell logic, so zero-match and
        spec-failure non-zero exits propagate.

- [x] Task 4: Surface discoverability and operator docs (AC: 8, 9)
  - [x] 4.1 Give the target a `##` help description that names dev-mode debug and the `FILE=`
        requirement, kept under the 72-char column.
  - [x] 4.2 Document `make test-e2e-dev-debug FILE=<real repo spec path>` in README as interactive,
        single-spec only, alongside the other dev-mode Playwright targets.
  - [x] 4.3 Note in `CLAUDE.md` that the debug target uses TTY-capable exec and that
        `PLAYWRIGHT_DEV_MODE` is recipe-scoped.

- [x] Task 5: Verify wiring statically (AC: 1, 3, 5, 8)
  - [x] 5.1 Run `make -n test-e2e-dev-debug` and confirm the FILE guard and TTY exec rendering.
  - [x] 5.2 Confirm `make help` shows the target and that `require-playwright-browsers` stays hidden.

(Every task/subtask is checked [x] because the work is implemented.)

## Dev Notes

### Architecture Decisions

- **TTY-capable exec for debug only:** The debug target uses
  `EXEC_DEV_TTY = $(DOCKER_COMPOSE) exec dev` (no `-T`), while every non-debug dev-mode target keeps
  the existing TTY-less helper pattern (`EXEC_DEV_TTYLESS`). Playwright Inspector and `page.pause()`
  require an allocated TTY for REPL input, so the architecture mandates TTY-capable exec here and
  forbids `EXEC_DEV_TTYLESS`, `BUN`, and `BUNX` for this target (architecture "Debug Pattern" and
  "Debug Execution Path").
- **`FILE` is required for debug:** Unlike `test-e2e-dev`/`test-visual-dev` where an omitted `FILE`
  means "run the whole suite," debug is single-spec only. The first recipe line fails non-zero with a
  remediation message naming `FILE=tests/e2e/...` (FR26-style messaging applied to the debug surface).
- **Same dev-mode config, injected in-container:** `PLAYWRIGHT_DEV_MODE=1` is set via `env` inside the
  container command (not as a host-side prefix), so the single `playwright.config.ts` resolves the
  dev-mode base URL and the `chromium-dev` project exactly as in non-debug dev runs. The flag stays
  recipe-scoped and never leaks to the IDE extension, CI, `make sh`, or the five production-parity
  targets (FR20).
- **`--debug` carries the trace port intent:** The recipe passes
  `PLAYWRIGHT_TRACE_PORT=$(PLAYWRIGHT_TRACE_PORT)` and `--debug` so the Inspector run and the
  host-reachable trace viewer share the documented default `9323`. Trace-port exposure on the `dev`
  service is owned by Story 3.2; this story consumes the variable.
- **Idempotent dev start, fail-fast preflight:** `ensure-dev` reuses a running dev container and only
  calls `make start` when dev is down (satisfying start-if-down and reuse-without-rebuild), never
  touching `start-prod`. `require-playwright-browsers` is a fail-fast preflight that also depends on
  `ensure-dev`, so ordering holds under parallel make.
- **FILE forwarding does not broaden:** Only the double-quoted `"$(FILE)"` is passed to Playwright;
  the test directory is not also appended (passing both would make Playwright's substring filters
  OR-match the whole suite). The host shell never expands the glob; Playwright resolves it. Zero-match
  and spec-failure non-zero exits are Playwright's own and are not masked.

### Project Structure Notes

- **Primary files:** `Makefile` (added `EXEC_DEV_TTY`, `PLAYWRIGHT_TRACE_PORT ?= 9323`, `FILE ?=`, and
  the `test-e2e-dev-debug` target with its `require-playwright-browsers` preflight), `README.md`
  (interactive single-spec debug example), `CLAUDE.md` (debug-target notes and recipe-scoped
  `PLAYWRIGHT_DEV_MODE`).
- **Inspect-only:** `playwright.config.ts` provides the dev-mode branching this target reuses but is
  not changed by this story; `docker-compose.yml` trace-port exposure is owned by Story 3.2.

### Testing Approach

- Static `make -n test-e2e-dev-debug` rendering was verified: the `FILE`-required guard fires first,
  and the run uses TTY-capable `docker compose exec dev` (no `-T`), with `PLAYWRIGHT_DEV_MODE=1`
  injected in-container via `env`, `PLAYWRIGHT_TRACE_PORT` forwarded, and `--debug` appended.
- `make help` confirmed the public target appears with a `<= 72`-char description, while
  `require-playwright-browsers` stays hidden (no `##` tag).
- The five frozen production-parity targets remain byte-identical, confirmed with
  `git diff main -- Makefile` (no hunks inside those target bodies).
- `markdownlint README.md CLAUDE.md` is clean.
- Honest scope: the interactive Inspector / `page.pause()` / REPL session and any live browser run
  were not executed here. The architecture's stated acceptance bar for this work is `make -n` wiring
  plus config validity, which is met; a live debug session is a runtime follow-up.

### References

- PRD: specs/makefile-playwright-targets/planning-artifacts/prd-makefile-playwright-targets-2026-04-16.md
  - FR9 (interactive debug e2e run), FR12 (`page.pause()`, Inspector prompts, REPL input)
- Architecture: specs/makefile-playwright-targets/planning-artifacts/architecture-makefile-playwright-targets-2026-04-16.md
  - "Debug Pattern", "Debug Execution Path", and "Variable & Command Patterns" (`EXEC_DEV_TTY`)
- Epics: specs/makefile-playwright-targets/planning-artifacts/epics-makefile-playwright-targets-2026-04-16.md
  - "Story 3.1: Run a Single Dev E2E Spec in Interactive Debug Mode"

## Dev Agent Record

### Agent Model Used

claude-opus-4-8

### Debug Log References

- `make -n test-e2e-dev-debug`: confirmed the `FILE=` guard renders first and that the run uses
  `docker compose exec dev` (TTY, no `-T`) with `env PLAYWRIGHT_DEV_MODE=1
PLAYWRIGHT_TRACE_PORT=9323 bun x playwright test "$(FILE)" --debug`.
- `make help`: confirmed `test-e2e-dev-debug` is listed with a description under 72 chars and
  `require-playwright-browsers` is hidden.
- `git diff main -- Makefile`: confirmed the five frozen Playwright target bodies are unchanged.
- `markdownlint README.md CLAUDE.md`: clean.

### Completion Notes List

- Delivered the `test-e2e-dev-debug` target: `FILE=` required (non-zero with remediation when
  omitted), TTY-capable `docker compose exec dev` (no `-T`, no `EXEC_DEV_TTYLESS`/`BUN`/`BUNX`),
  `PLAYWRIGHT_DEV_MODE=1` injected in-container so the dev-mode base URL and `chromium-dev` project
  match non-debug dev runs, `--debug` for Playwright Inspector / `page.pause()`, and
  `PLAYWRIGHT_TRACE_PORT` forwarded (default `9323`).
- Added `EXEC_DEV_TTY`, `PLAYWRIGHT_TRACE_PORT ?= 9323`, and `FILE ?=` next to their existing kin;
  documented the interactive single-spec workflow in README and `CLAUDE.md`.
- Only `"$(FILE)"` is forwarded to Playwright (test dir not appended), so zero-match and spec-failure
  non-zero exits propagate unmasked.
- Honest runtime follow-up: browser install and a live interactive Inspector / `page.pause()` /
  REPL session were not executed in this environment (the dev container has no outbound network here,
  and the Alpine base image is not Playwright's officially supported target for its bundled Chromium;
  the repo-pinned apk Chromium is the PRD R-chromium-pin alternative). No green browser run is
  claimed — verification for this story is `make -n` wiring plus config validity.

### File List

- `Makefile`
- `README.md`
- `CLAUDE.md`
- `specs/makefile-playwright-targets/implementation-artifacts/3-1-run-a-single-dev-e2e-spec-in-interactive-debug-mode.md`
