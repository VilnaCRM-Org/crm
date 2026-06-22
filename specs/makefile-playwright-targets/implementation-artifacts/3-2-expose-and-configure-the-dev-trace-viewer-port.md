# Story 3.2: Expose and Configure the Dev Trace Viewer Port

Status: done

## Story

As a frontend engineer inspecting Playwright traces,
I want trace viewer access on a documented host port,
so that I can open debugging output locally without conflicting with existing app ports.

## Acceptance Criteria

1. The default debug configuration makes the trace viewer reachable from the host on port `9323`,
   and that default does not conflict with `DEV_PORT=3000`, `PROD_PORT=3001`, or
   `GRAPHQL_PORT=4000`.
2. Setting `PLAYWRIGHT_TRACE_PORT=<custom-port>` makes `make test-e2e-dev-debug FILE=<spec>` use the
   custom host port, with no source-code changes required to switch ports.
3. Trace-viewer port exposure is scoped to the existing `dev` service in Docker Compose and the
   Makefile, and no new Playwright dev service is introduced.
4. The Makefile defines `PLAYWRIGHT_TRACE_PORT ?= 9323` (or equivalent defaulting), and the variable
   is documented as user-overridable.
5. `make -n test-e2e-dev-debug FILE=tests/e2e/...` renders a command that passes the trace-viewer
   port intent through the debug workflow while preserving TTY-capable execution.
6. The README documents the default `http://localhost:9323` access path and how to override it with
   `PLAYWRIGHT_TRACE_PORT`.
7. `make help` keeps trace-viewer access discoverable via the debug target or nearby help text, and
   does not imply trace-viewer behavior is part of CI.

## Tasks / Subtasks

- [x] Task 1: Define the overridable trace-port variable in the Makefile (AC: 1, 4)
  - [x] 1.1 Add `PLAYWRIGHT_TRACE_PORT ?= 9323` next to the existing port variables, using the
        uppercase snake_case convention and `?=` so the value is user-overridable.
  - [x] 1.2 Confirm `9323` does not collide with `DEV_PORT` (`3000`), `PROD_PORT` (`3001`), or
        `GRAPHQL_PORT` (`4000`).

- [x] Task 2: Thread the trace port through the debug workflow only (AC: 2, 5)
  - [x] 2.1 Pass `PLAYWRIGHT_TRACE_PORT=$(PLAYWRIGHT_TRACE_PORT)` into the container command of
        `test-e2e-dev-debug` via `env`, alongside `PLAYWRIGHT_DEV_MODE=1`.
  - [x] 2.2 Use the TTY-capable `EXEC_DEV_TTY` (`docker compose exec dev`, no `-T`) so the debug run
        keeps an interactive TTY while carrying the port intent.
  - [x] 2.3 Keep the override path source-free: changing the host port is a variable change only.

- [x] Task 3: Publish the port from the existing dev service (AC: 1, 3)
  - [x] 3.1 Add `${PLAYWRIGHT_TRACE_PORT:-9323}:${PLAYWRIGHT_TRACE_PORT:-9323}` to the `dev` service
        published ports in `docker-compose.yml`.
  - [x] 3.2 Confirm no new service is added; the trace port is scoped to `dev` only.

- [x] Task 4: Document trace-viewer access and overrides (AC: 6, 7)
  - [x] 4.1 Document the default `http://localhost:9323` access path and the `PLAYWRIGHT_TRACE_PORT`
        override in the README dev-mode Playwright section.
  - [x] 4.2 Keep `make help` text discoverable for the debug target without implying CI involvement.

- [x] Task 5: Verify wiring statically (AC: 5)
  - [x] 5.1 Run `make -n test-e2e-dev-debug FILE=...` and confirm the rendered command carries the
        port through `env` and preserves the TTY (`docker compose exec dev`, no `-T`).
  - [x] 5.2 Run markdownlint on README so the documentation change passes without suppressions.

(Every task/subtask is checked `[x]` because the work is implemented.)

## Dev Notes

### Architecture Decisions

- **Default port `9323`, collision-free:** The architecture's Core Architectural Decisions fix the
  trace viewer at `PLAYWRIGHT_TRACE_PORT`, default `9323`. That value sits outside the app port
  cluster (`3000`/`3001`/`4000`), satisfying FR28 by construction.
- **`?=` for overridability:** `PLAYWRIGHT_TRACE_PORT ?= 9323` follows the repo's port-variable
  pattern and lets a developer override the host port from the environment without editing the
  Makefile or any source, satisfying FR11.
- **Recipe-scoped pass-through:** The port is injected into the container command of
  `test-e2e-dev-debug` via `env PLAYWRIGHT_TRACE_PORT=$(PLAYWRIGHT_TRACE_PORT)`, next to the existing
  `PLAYWRIGHT_DEV_MODE=1`. It is never a top-level Make assignment, Compose `environment` entry, or
  Dockerfile `ENV`, so it cannot leak to unrelated workflows.
- **TTY preserved:** The debug recipe uses `EXEC_DEV_TTY` (`docker compose exec dev`, no `-T`), so
  passing the port intent does not regress the interactive TTY that Playwright Inspector needs.
- **Single dev service, no new service:** Port publication is added only to the `dev` service in
  `docker-compose.yml` as `${PLAYWRIGHT_TRACE_PORT:-9323}:${PLAYWRIGHT_TRACE_PORT:-9323}`. The
  Compose default mirrors the Makefile default so an unset variable still resolves to `9323`,
  satisfying FR10 with no new Playwright dev service (FR28 isolation intent preserved).

### Project Structure Notes

- **Primary files:** `Makefile` (the `PLAYWRIGHT_TRACE_PORT ?= 9323` variable and the
  `PLAYWRIGHT_TRACE_PORT` pass-through in the `test-e2e-dev-debug` recipe via `EXEC_DEV_TTY`),
  `docker-compose.yml` (the published trace port on the `dev` service), `README.md` (the trace-viewer
  default-port and override documentation).
- **Inspect-only:** `docker-compose.test.yml` was audited and left unchanged; `prod` and
  `playwright` live only there and are not part of the dev `start` path, so the trace port is not
  published for them.

### Testing Approach

- Verification for this story is static, matching the architecture's stated acceptance bar of
  `make -n` wiring plus config validity (no live browser run was performed in this environment).
- `make -n test-e2e-dev-debug FILE=...` was rendered and inspected: the command uses
  `docker compose exec dev` (TTY-capable, no `-T`) and injects both `PLAYWRIGHT_DEV_MODE=1` and
  `PLAYWRIGHT_TRACE_PORT=$(PLAYWRIGHT_TRACE_PORT)` in-container via `env` before
  `bun x playwright test "$(FILE)" --debug`.
- The default value `9323` was confirmed distinct from `DEV_PORT=3000`, `PROD_PORT=3001`, and
  `GRAPHQL_PORT=4000`.
- The Compose `dev` port mapping `${PLAYWRIGHT_TRACE_PORT:-9323}:${PLAYWRIGHT_TRACE_PORT:-9323}` was
  reviewed to confirm an unset variable still resolves to `9323` and no new service is introduced.
- `markdownlint README.md` passed clean; the trace-viewer documentation carries the default access
  path and override variable.

### References

- PRD: `specs/makefile-playwright-targets/planning-artifacts/prd-makefile-playwright-targets-2026-04-16.md`
  - FR10 (trace viewer reachable on default port `9323`)
  - FR11 (override via `PLAYWRIGHT_TRACE_PORT`)
  - FR28 (default trace port avoids `3000`/`3001`/`4000` collision)
- Architecture: `specs/makefile-playwright-targets/planning-artifacts/architecture-makefile-playwright-targets-2026-04-16.md`
  - `Core Architectural Decisions` (trace viewer default `9323`)
  - `Naming Patterns` (`PLAYWRIGHT_TRACE_PORT ?= 9323`)
  - `Requirements to Structure Mapping` (Makefile variable plus `docker-compose.yml` dev-service
    trace port)
- Epics: `specs/makefile-playwright-targets/planning-artifacts/epics-makefile-playwright-targets-2026-04-16.md`
  - `Story 3.2: Expose and Configure the Dev Trace Viewer Port`

## Dev Agent Record

### Agent Model Used

claude-opus-4-8

### Debug Log References

- `make -n test-e2e-dev-debug FILE=tests/e2e/modules/back-to-main.spec.ts`: rendered command uses
  `docker compose exec dev env PLAYWRIGHT_DEV_MODE=1 PLAYWRIGHT_TRACE_PORT=$(PLAYWRIGHT_TRACE_PORT)
bun x playwright test "..." --debug`; TTY preserved (no `-T`).
- Confirmed `PLAYWRIGHT_TRACE_PORT ?= 9323` sits beside the existing port variables and is distinct
  from `DEV_PORT`/`PROD_PORT`/`GRAPHQL_PORT`.
- Reviewed `docker-compose.yml` `dev` service: published
  `${PLAYWRIGHT_TRACE_PORT:-9323}:${PLAYWRIGHT_TRACE_PORT:-9323}`; no new service added.
- `markdownlint README.md`: clean.

### Completion Notes List

- Added `PLAYWRIGHT_TRACE_PORT ?= 9323` to the Makefile and threaded it into the
  `test-e2e-dev-debug` container command via `env`, preserving the TTY-capable `EXEC_DEV_TTY`
  execution path (FR11, FR10).
- Published the trace port on the existing `dev` service in `docker-compose.yml` as
  `${PLAYWRIGHT_TRACE_PORT:-9323}:${PLAYWRIGHT_TRACE_PORT:-9323}`, scoped to `dev` with no new
  service (FR10, FR28).
- The default `9323` is collision-free against `3000`/`3001`/`4000` (FR28), and the override is a
  variable change only — no source edits needed (FR11).
- Documented the `http://localhost:9323` default access path and the `PLAYWRIGHT_TRACE_PORT`
  override in the README; `make help` keeps the debug target discoverable without implying CI use.
- Runtime-verification follow-up (honest caveat): a live trace-viewer session and an in-browser
  Playwright debug run were not executed here. The dev container has no outbound network in this
  environment, and the Alpine base image is not Playwright's officially supported target for its
  bundled Chromium, so port reachability was verified by static `make -n` wiring and the Compose
  port mapping rather than by opening `http://localhost:9323` against a live trace. No green browser
  run is claimed for this story.

### File List

- `Makefile`
- `docker-compose.yml`
- `README.md`
- `specs/makefile-playwright-targets/implementation-artifacts/3-2-expose-and-configure-the-dev-trace-viewer-port.md`
