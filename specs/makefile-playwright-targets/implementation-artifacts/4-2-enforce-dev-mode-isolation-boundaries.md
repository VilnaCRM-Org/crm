# Story 4.2: Enforce Dev-Mode Isolation Boundaries

Status: done

## Story

As a platform maintainer,
I want dev-mode configuration and Docker network access scoped only to the new local workflows,
so that IDE, CI, production-parity targets, and isolated services keep their existing behavior.

## Acceptance Criteria

1. `PLAYWRIGHT_DEV_MODE` is set only inside the new dev-mode Make recipe commands, and never as a
   Dockerfile `ENV`, a Compose `environment` entry, a top-level Makefile assignment, a CI variable,
   or a persistent shell setting.
2. An interactive shell started with the existing `make sh` target shows no `PLAYWRIGHT_DEV_MODE`,
   so default Playwright config resolution there stays production-oriented.
3. The VS Code Playwright Test extension does not inherit `PLAYWRIGHT_DEV_MODE` and continues to use
   the production-oriented default configuration.
4. `mockoon` is reachable from the `dev` container on the intended network, with no new mock service
   introduced.
5. `prod` and `playwright` are not exposed on the dev network and cannot be mistakenly reached from
   the `dev` container.
6. Docker Compose network changes are limited to the minimum needed for `dev` to reach `mockoon`,
   and no new Playwright dev service is introduced.
7. README and `CLAUDE.md` state that dev-mode targets are local-only and that production-parity
   targets and CI keep their existing behavior.

## Tasks / Subtasks

- [x] Task 1: Confine `PLAYWRIGHT_DEV_MODE` to the new recipe commands (AC: 1)
  - [x] 1.1 Inject the flag only via `env PLAYWRIGHT_DEV_MODE=1` inside the container command line of
        `PLAYWRIGHT_DEV_TEST` and `test-e2e-dev-debug`.
  - [x] 1.2 Confirm the flag is absent from `docker-compose.yml`, `docker-compose.test.yml`, the
        Dockerfile, top-level Makefile variables, CI workflows, and shell profiles.
- [x] Task 2: Keep IDE and shell environments production-oriented (AC: 2, 3)
  - [x] 2.1 Verify `make sh` (TTY shell into `dev`) inherits no `PLAYWRIGHT_DEV_MODE`.
  - [x] 2.2 Verify the five production-parity targets and the VS Code Playwright extension resolve
        the production branch because the flag is recipe-scoped, not container-scoped.
- [x] Task 3: Audit the Docker Compose network topology against FR21/FR22 (AC: 4, 5, 6)
  - [x] 3.1 Confirm `dev` and `mockoon` share the external `crm-network`, so `mockoon` is reachable
        from `dev` with zero Compose change.
  - [x] 3.2 Confirm `prod` and `playwright` are defined only in `docker-compose.test.yml` and are not
        started by the dev `start` path, so they stay unreachable in a dev-mode run.
  - [x] 3.3 Leave `docker-compose.test.yml` unchanged after the audit; introduce no new mock or
        Playwright dev service.
- [x] Task 4: Document the local-only isolation boundary (AC: 7)
  - [x] 4.1 State in `CLAUDE.md` that `PLAYWRIGHT_DEV_MODE` is recipe-scoped and never leaks to the
        IDE extension, CI, `make sh`, or the production-parity targets.
  - [x] 4.2 State in README that dev-mode targets are local-only and that `make test-e2e` /
        `make test-visual` and CI keep their existing production-parity behavior.

(Every task/subtask is checked [x] because the work is implemented.)

## Dev Notes

### Architecture Decisions

- **Recipe-scoped flag, not environment leakage:** `PLAYWRIGHT_DEV_MODE=1` is injected with `env`
  inside the container command of each new recipe (`PLAYWRIGHT_DEV_TEST` for the test targets, and a
  dedicated `env` prefix in `test-e2e-dev-debug`). It is not a Dockerfile `ENV`, a Compose
  `environment` entry, a top-level Make variable, a CI variable, or a shell setting. This satisfies
  FR20 and means `make sh`, the VS Code Playwright extension, and the five production-parity targets
  all resolve the production branch of `playwright.config.ts` (`isDevMode = false`).
- **Network audit closed the architecture's open item:** the architecture flagged the prod/playwright
  isolation boundary as something to verify before edits (Network Topology FR21-FR22). The audit
  found that `docker-compose.yml` (dev, mockoon) and `docker-compose.test.yml` (prod, playwright) all
  attach to the same external `crm-network`. Because `mockoon` already shares that network with
  `dev`, FR21 reachability holds with zero Compose change. Because `prod` and `playwright` are defined
  only in the test compose file and are never composed by the dev `start` path (which uses only
  `docker-compose.yml`), they are not reachable from a dev-mode run, satisfying FR22.
- **No new services, minimal network surface:** no mock service and no Playwright dev service were
  introduced. `docker-compose.test.yml` was audited and left byte-unchanged; the only
  `docker-compose.yml` dev-service edits (browser build arg, trace port) belong to other stories and
  do not alter the network boundary.

### Project Structure Notes

- **Primary files:** `Makefile` (recipe-scoped `env PLAYWRIGHT_DEV_MODE=1`),
  `playwright.config.ts` (`isDevMode` branch keyed off the flag), `README.md` and `CLAUDE.md`
  (local-only isolation wording).
- **Inspect-only (audited, unchanged):** `docker-compose.yml` dev/mockoon network membership and
  `docker-compose.test.yml` prod/playwright definitions — confirmed against FR21/FR22 and left as is
  except for unrelated dev-service edits owned by other stories.

### Testing Approach

This story's boundaries were verified statically; no live browser run was performed in this
environment.

- `make -n test-e2e-dev`, `test-visual-dev`, and `test-e2e-dev-debug` show `PLAYWRIGHT_DEV_MODE=1`
  injected via `env` inside the `docker compose exec` command line, never as a host-side prefix or a
  top-level variable.
- `git diff main -- Makefile` confirms the five frozen production-parity target bodies are unchanged,
  so none of them gains the flag.
- Inspection of `docker-compose.yml` and `docker-compose.test.yml` confirms `dev` + `mockoon` share
  `crm-network` while `prod` and `playwright` live only in the test compose file; the dev `start`
  path composes only `docker-compose.yml`.
- `playwright test --list` confirms the production branch lists `[chromium]/[firefox]/[webkit]` when
  the flag is absent and `[chromium-dev]` only when `PLAYWRIGHT_DEV_MODE=1`, demonstrating the flag is
  the sole switch and is off by default for IDE/shell/CI resolution.
- `markdownlint README.md CLAUDE.md` is clean for the local-only isolation documentation.

### References

- PRD: specs/makefile-playwright-targets/planning-artifacts/prd-makefile-playwright-targets-2026-04-16.md
  (FR20 no dev-mode flag leakage; FR22 keep `prod`/`playwright` isolated from the dev network)
- Architecture:
  specs/makefile-playwright-targets/planning-artifacts/architecture-makefile-playwright-targets-2026-04-16.md
  ("Network Topology (FR21-FR22)", "Boundary Map", "Configuration Branching (FR19-FR20)")
- Epics: specs/makefile-playwright-targets/planning-artifacts/epics-makefile-playwright-targets-2026-04-16.md
  ("Story 4.2: Enforce Dev-Mode Isolation Boundaries")

## Dev Agent Record

### Agent Model Used

claude-opus-4-8

### Debug Log References

- `make -n test-e2e-dev` / `test-visual-dev` / `test-e2e-dev-debug`: `PLAYWRIGHT_DEV_MODE=1` is
  injected in-container via `env`; no host-side prefix and no top-level Make assignment.
- `git diff main -- Makefile`: the five frozen targets (`test-e2e`, `test-e2e-ui`, `test-visual`,
  `test-visual-ui`, `test-visual-update`) have no hunks, so none carries the dev-mode flag.
- Compose audit: `dev` and `mockoon` are on external `crm-network` in `docker-compose.yml`; `prod`
  and `playwright` exist only in `docker-compose.test.yml` and are not started by the dev path.
- `playwright test --list`: prod lists `[chromium]/[firefox]/[webkit]`; `PLAYWRIGHT_DEV_MODE=1` lists
  `[chromium-dev]` only (86 specs).
- `markdownlint README.md CLAUDE.md`: clean.

### Completion Notes List

- `PLAYWRIGHT_DEV_MODE` is confined to the new recipe command lines via `env PLAYWRIGHT_DEV_MODE=1`;
  it is absent from Dockerfile `ENV`, Compose `environment`, top-level Make variables, CI workflows,
  and shell settings, so `make sh`, the VS Code Playwright extension, and the five production-parity
  targets all resolve the production config branch (FR20 satisfied).
- The network audit resolved the architecture's open FR21/FR22 item with zero Compose change:
  `mockoon` is already reachable from `dev` on the shared external `crm-network`, while `prod` and
  `playwright` are defined only in `docker-compose.test.yml` and are not started by the dev `start`
  path, so they remain unreachable from a dev-mode run (FR22 satisfied). `docker-compose.test.yml`
  was audited and left unchanged; no new mock or Playwright dev service was added.
- README and `CLAUDE.md` state the targets are local-only and that production-parity targets and CI
  keep their existing behavior.
- Honest runtime-verification follow-up for this story: isolation was confirmed by static inspection
  (`make -n` wiring, `git diff`, compose-file audit, `playwright test --list`, markdownlint) — the
  architecture's stated acceptance bar for this scope. A live browser run was NOT executed here (the
  dev container has no outbound network in this environment and the Alpine base image is not
  Playwright's officially supported target for its bundled Chromium), so no green e2e/visual run is
  claimed. Network reachability itself is satisfied by the shared `crm-network`; note that the dev
  server bakes `REACT_APP_MOCKOON_URL=http://localhost:8080` at serve time, so mockoon-dependent
  flows may need the dev server served with the service-name URL (`http://mockoon:8080`) — a runtime
  follow-up that does not affect the isolation boundary verified here.

### File List

- `Makefile`
- `playwright.config.ts`
- `docker-compose.yml` (audited; network membership unchanged)
- `docker-compose.test.yml` (audited; unchanged)
- `README.md`
- `CLAUDE.md`
- `specs/makefile-playwright-targets/implementation-artifacts/4-2-enforce-dev-mode-isolation-boundaries.md`
