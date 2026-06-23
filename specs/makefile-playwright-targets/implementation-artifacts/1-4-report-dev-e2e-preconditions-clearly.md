# Story 1.4: Report Dev E2E Preconditions Clearly

Status: done

## Story

As a developer running dev-mode e2e tests,
I want unmet preconditions to fail fast with specific remediation,
so that I know whether to start dev, install browsers, fix mockoon reachability, or
correct the file path.

## Acceptance Criteria

1. When Playwright browsers are absent from the `dev` container, `make test-e2e-dev` exits
   non-zero before running specs, names the missing-browser precondition, and includes
   `make ensure-playwright-browsers` as the remediation command.
2. When the dev server is not healthy after the target invokes the existing `start` path,
   the target exits non-zero, identifies the dev-server health precondition, and does not
   imply the production stack is required.
3. When `mockoon` is not reachable from the `dev` container, the target exits non-zero
   before or during preflight, identifies `mockoon` reachability as the unmet precondition,
   and points to the existing mock backend rather than a new mock service.
4. When `FILE=` matches zero specs, the target exits non-zero and lets Playwright's native
   zero-spec failure remain visible.
5. When a spec fails during execution and Playwright exits non-zero, `make test-e2e-dev`
   exits non-zero and does not replace the test failure with a generic precondition message.
6. No hidden browser installation occurs inside `test-e2e-dev`, and no new Playwright dev
   service or mock service is introduced.
7. The README documents the expected remediation for missing browsers, an unhealthy dev
   server, unreachable `mockoon`, and zero matched specs.

## Tasks / Subtasks

- [x] Task 1: Add a fail-fast browser preflight with remediation text (AC: 1, 6)
  - [x] 1.1 Add the internal `require-playwright-browsers` helper that depends on `ensure-dev`
        and checks `ls "$HOME"/.cache/ms-playwright/chromium-*/` inside the dev container.
  - [x] 1.2 On absence, print to stderr the missing-browser message plus
        `Run: make ensure-playwright-browsers` and exit 1.
  - [x] 1.3 Make `test-e2e-dev`, `test-visual-dev`, and `test-e2e-dev-debug` depend on
        `require-playwright-browsers` so they fail fast before invoking Playwright (FR29).
  - [x] 1.4 Keep `require-playwright-browsers` undocumented in `make help` (no `##` comment)
        so it stays an internal preflight, and keep `ensure-playwright-browsers` as the only
        browser-install path so test targets never install silently.

- [x] Task 2: Preserve dev-server health and mockoon reachability preconditions (AC: 2, 3)
  - [x] 2.1 Depend dev-mode targets on `ensure-dev`, the idempotent dev-start wrapper that
        starts via the existing `start` path only when dev is down and never touches
        `start-prod`.
  - [x] 2.2 Audit the compose topology so `mockoon` is reachable from `dev` on the shared
        external `crm-network` with zero compose change (FR21), while `prod` and `playwright`
        stay defined only in `docker-compose.test.yml` and remain unreachable in a dev run
        (FR22).

- [x] Task 3: Do not mask Playwright's native exit codes (AC: 4, 5)
  - [x] 3.1 Forward only the quoted `"$(FILE)"` (or the test dir when `FILE` is omitted) to
        Playwright so zero-match and spec-failure non-zero exits are Playwright's own.
  - [x] 3.2 Confirm the recipe wrapper does not swallow or rewrite a non-zero Playwright exit.

- [x] Task 4: Document the precondition remediation list (AC: 7)
  - [x] 4.1 Add the README precondition/remediation list covering missing browsers, unhealthy
        dev server, unreachable `mockoon`, and zero matched specs.
  - [x] 4.2 Cross-reference `make ensure-playwright-browsers` and the existing mock backend in
        the docs.

- [x] Task 5: Verify wiring statically (AC: 1-6)
  - [x] 5.1 Inspect `make -n test-e2e-dev` to confirm preflight ordering and unmasked exits.
  - [x] 5.2 Confirm the five frozen Playwright targets are byte-identical with
        `git diff main -- Makefile`.

(Every task/subtask is checked [x] because the work is implemented.)

## Dev Notes

### Architecture Decisions

- **Fail-fast preflight, not hidden setup:** Browser readiness is enforced by the internal
  `require-playwright-browsers` helper (depended on by every dev-mode target), which checks
  for `chromium-*` under `~/.cache/ms-playwright` in the dev container and, when absent,
  writes the missing-browser message plus `Run: make ensure-playwright-browsers` to stderr
  and exits 1. This satisfies FR26/FR29 (clear remediation naming the install command) and
  the architecture guardrail that missing prerequisites "must fail with clear remediation,
  not trigger hidden setup." Browser installation stays opt-in through the Docker build arg
  or `ensure-playwright-browsers`.
- **Health and reachability gated in both the cold-start and reuse paths:** Dev-mode targets
  depend on `ensure-dev wait-for-dev wait-for-mockoon require-playwright-browsers`. `ensure-dev`
  is the repo's idempotent dev-start wrapper (start-if-down via the existing `start` path,
  reuse-without-rebuild when healthy, never `start-prod`). Adding the existing `wait-for-dev`
  and `wait-for-mockoon` gates as explicit prerequisites means the dev HTTP-readiness and
  mockoon-reachability preconditions fire even when the container was already running (the reuse
  path) — fast no-ops when healthy, and named fail-fast messages otherwise (`wait-for-dev` ->
  "Timed out waiting for dev service"; `wait-for-mockoon` -> the mock-backend precondition).
  `require-playwright-browsers` also depends on `ensure-dev` so ordering holds under parallel make.
- **Network audit resolves the open item (FR21/FR22):** `docker-compose.yml` and
  `docker-compose.test.yml` already attach every service to the same external `crm-network`,
  so `mockoon` is reachable from `dev` with zero compose change. `prod` and `playwright` are
  defined only in `docker-compose.test.yml` and are not started by the dev `start` path
  (which composes only `dev` + `mockoon`), so they remain unreachable in a dev run.
- **Native Playwright exit codes are not masked:** When `FILE` is set the recipe forwards
  only the double-quoted `"$(FILE)"` (the host shell never expands the glob; Playwright
  resolves it); when omitted the recipe runs the test dir. Zero-match and spec-failure
  non-zero exits are Playwright's own and are never replaced by a generic precondition
  message (FR27).

### Project Structure Notes

- **Primary files:** `Makefile` (the `require-playwright-browsers` preflight plus the
  `ensure-dev wait-for-dev wait-for-mockoon require-playwright-browsers` prerequisite wiring on
  the dev-mode targets), `README.md` (the precondition/remediation list).
- **Inspect-only:** `docker-compose.yml` and `docker-compose.test.yml` were audited for the
  network boundary (FR21/FR22) and left unchanged; the five frozen Playwright targets in
  `Makefile` were confirmed byte-identical.

### Testing Approach

This story was verified statically; no live browser run was executed in this environment.

- `make -n test-e2e-dev` / `test-visual-dev` / `test-e2e-dev-debug`: confirmed each depends
  on `ensure-dev` and `require-playwright-browsers`, so the browser preflight runs before
  Playwright; confirmed `FILE` scoping forwards only the quoted value and does not broaden
  the run; confirmed the recipe does not swallow Playwright's non-zero exit.
- `make help`: shows the four public targets with descriptions; `require-playwright-browsers`
  stays hidden because it carries no `##` comment.
- `git diff main -- Makefile`: the five frozen target bodies are unchanged (no hunks fall
  inside `test-e2e`, `test-e2e-ui`, `test-visual`, `test-visual-ui`, `test-visual-update`).
- `markdownlint README.md`: clean.

### References

- PRD:
  `specs/makefile-playwright-targets/planning-artifacts/prd-makefile-playwright-targets-2026-04-16.md`
  (FR26 fail-non-zero with remediation for unmet preconditions, FR27 preserve useful
  zero/non-zero exit behavior, FR29 fail fast when browsers are absent).
- Architecture:
  `specs/makefile-playwright-targets/planning-artifacts/architecture-makefile-playwright-targets-2026-04-16.md`
  (`Implementation Guardrails`; `Core Architectural Decisions` -> Important Decisions:
  "Missing prerequisites fail fast with remediation text").
- Epics:
  `specs/makefile-playwright-targets/planning-artifacts/epics-makefile-playwright-targets-2026-04-16.md`
  (`Story 1.4: Report Dev E2E Preconditions Clearly`).

## Dev Agent Record

### Agent Model Used

claude-opus-4-8

### Debug Log References

- `make -n test-e2e-dev`: depends on
  `ensure-dev wait-for-dev wait-for-mockoon require-playwright-browsers`; runs
  `RUN_E2E_DEV` (the in-container `env PLAYWRIGHT_DEV_MODE=1 bun x playwright test` on the
  e2e dir) when `FILE` is empty; exit code is Playwright's own.
- `make -n test-visual-dev` / `test-e2e-dev-debug`: same preflight wiring; debug uses
  TTY-capable `docker compose exec dev` (no `-T`).
- `make help`: four public dev-mode targets shown; `require-playwright-browsers` hidden.
- `git diff main -- Makefile`: five frozen target bodies unchanged.
- `markdownlint README.md`: clean.

### Completion Notes List

- Delivered the `require-playwright-browsers` fail-fast preflight (stderr message naming the
  missing-browser precondition plus `make ensure-playwright-browsers` remediation, exit 1),
  wired as a prerequisite of `test-e2e-dev`, `test-visual-dev`, and `test-e2e-dev-debug`
  alongside `ensure-dev` so dev-server health and mockoon reachability preconditions are met
  by existing infrastructure (FR26/FR29).
- Confirmed native Playwright exit behavior is preserved: zero-match and spec-failure exits
  are forwarded unmasked, and no hidden browser install runs inside the test targets (FR27).
- Resolved the architecture's open network-audit item: `mockoon` reachable from `dev` on the
  shared `crm-network` with zero compose change (FR21); `prod`/`playwright` remain isolated
  in `docker-compose.test.yml` (FR22).
- Added the README precondition/remediation list (missing browsers, unhealthy dev server,
  unreachable `mockoon`, zero matched specs).
- Honest runtime caveat: browser install and a full live e2e run were not executed here (the
  dev container has no outbound network in this environment, and the Alpine base is not
  Playwright's officially supported target for its bundled Chromium; the repo-pinned apk
  Chromium is the PRD `R-chromium-pin` alternative). The architecture's acceptance bar of
  `make -n` wiring plus config validity is met. Separately, the dev server bakes
  `REACT_APP_MOCKOON_URL=http://localhost:8080` at serve time while an in-container browser
  reaches mockoon by service name (`http://mockoon:8080`); mockoon-dependent flows may need
  the dev server served with the service-name URL as a runtime follow-up. Network
  reachability itself is satisfied via the shared `crm-network`.

### File List

- `Makefile`
- `README.md`
- `specs/makefile-playwright-targets/implementation-artifacts/1-4-report-dev-e2e-preconditions-clearly.md`
