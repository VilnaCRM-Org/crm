# Story 1.3: Add Mockoon Readiness and Failure Output

Status: review

## Story

As a developer,
I want clear readiness and failure output for Mockoon startup,
so that I know whether the local API mock is ready or why startup failed.

## Acceptance Criteria

1. `MOCKOON_PORT ?= 8080` is defined near the existing port variables.
2. `wait-for-mockoon` polls `http://$(WEBSITE_DOMAIN):$(MOCKOON_PORT)/api/users` with host-side
   `curl` (the same endpoint Mockoon's compose healthcheck uses).
3. The poll retries with a bounded number of attempts (`WAIT_FOR_MOCKOON_MAX_TRIES`) before failing.
4. The target prints a waiting message before probing.
5. The target prints a success message when Mockoon is ready.
6. The target exits non-zero with a clear failure message when Mockoon is not ready.

## Tasks / Subtasks

- [ ] Task 1: Lock the Mockoon readiness contract with tooling coverage (AC: 1, 2, 3, 4, 5, 6)
  - [ ] 1.1 Add a focused tooling test for the `wait-for-mockoon` target definition.
  - [ ] 1.2 Assert the Makefile keeps `MOCKOON_PORT ?= 8080` alongside the other public
        port variables.
  - [ ] 1.3 Assert the readiness check curls `http://$(WEBSITE_DOMAIN):$(MOCKOON_PORT)/api/users`.
  - [ ] 1.4 Assert the poll retries via a bounded loop and does not depend on `$(BIN_DIR)/wait-on`.
  - [ ] 1.5 Assert the target prints explicit waiting, success, and failure output.

- [ ] Task 2: Implement the external readiness gate (AC: 2, 3, 4, 5, 6)
  - [ ] 2.1 Use a host-side `curl` polling loop against `/api/users`, mirroring `wait-for-dev`.
  - [ ] 2.2 Keep the failure path non-zero and clear for the developer.
  - [ ] 2.3 Preserve Mockoon log output on failure to aid startup debugging.

- [ ] Task 3: Verify the startup contract stays aligned (AC: 1, 2, 3, 4, 5, 6)
  - [ ] 3.1 Run the focused Mockoon readiness tooling test and watch it fail before the
        Makefile change.
  - [ ] 3.2 Re-run the same test after the Makefile change and confirm it passes.
  - [ ] 3.3 Re-run the adjacent `make start` tooling contract test to confirm the
        Story 1.2 behavior still holds.

## Dev Notes

### Architecture Decisions

- **Readiness mechanism:** Use a host-side `curl` polling loop against
  `http://$(WEBSITE_DOMAIN):$(MOCKOON_PORT)/api/users` — the same endpoint Mockoon's compose
  healthcheck probes. This mirrors the proven `wait-for-dev` pattern and depends only on `curl`,
  which is always present on developer and CI hosts.
- **Execution boundary:** Run the probe from the host (not inside the `dev` container) because
  `localhost:$(MOCKOON_PORT)` must resolve to the published host port. Do **not** depend on
  `$(BIN_DIR)/wait-on` (`./node_modules/.bin/wait-on`): host dependencies are not installed in CI
  (deps live inside the Docker image), so that binary is absent on the runner and the probe fails
  instantly. `curl` avoids this host-dependency trap.
- **Failure diagnostics:** Keep a clear failure message and append `docker compose ... logs mockoon`
  output on timeout so the developer sees the reason for startup failure without extra commands.
- **Scope boundary:** This story owns only the `wait-for-mockoon` readiness semantics and output.
  Story 1.2 owns the `make start` orchestration, and Story 1.4 owns any `start-prod` fallout.

### Project Structure Notes

- **Primary file:** `Makefile`
- **Focused test file:** `tests/unit/tooling/mockoon-readiness.test.ts`
- **Regression check:** `tests/unit/tooling/make-start.test.ts`

### Testing Approach

- Use a tooling-level unit test that reads the Makefile and asserts the exact `wait-for-mockoon`
  contract.
- Verify the red-green cycle on the new test before and after the Makefile change.
- Re-run the adjacent `make start` tooling test to ensure the new readiness contract does not break
  the startup flow introduced in Story 1.2.

### References

- Architecture: `specs/start-ci-chromium/planning-artifacts/architecture-ci-chromium-2026-04-14.md`
  - `Mockoon Health Check`
  - `Naming Patterns`
- Epics: `specs/start-ci-chromium/planning-artifacts/epics-start-ci-chromium-2026-04-14.md`
  - `Epic 1 Stories: Complete Local Development Startup`
  - `Story 1.3: Add Mockoon Readiness and Failure Output`
- PRD: `specs/start-ci-chromium/planning-artifacts/prd-start-ci-chromium-2026-04-10.md`
  - `FR3`, `FR4`, `FR5`

## Dev Agent Record

### Agent Model Used

gpt-5-codex

### Debug Log References

- Confirmed the current Makefile already defined `MOCKOON_PORT ?= 8080` near the other port
  variables, so the missing work was isolated to the `wait-for-mockoon` contract.
- Verified the pre-change target still used an HTTP `/api/users` polling loop, which did not match
  the selected TCP `wait-on` architecture for Story 1.3.
- Verified that running `wait-on tcp:localhost:8080` through `$(BUNX)` fails from inside the `dev`
  container, while the same probe succeeds from the host and `http://mockoon:8080/api/users`
  succeeds from inside `dev`.
- Verified the focused tooling test failed before the Makefile change and passed afterward.

### Completion Notes List

- Created the BMAD story artifact for Story 1.3 in the configured implementation artifact set.
- Implemented the Mockoon readiness gate as a host-side `curl` polling loop against `/api/users`
  with explicit startup messages.
- Preserved Mockoon logs in the failure path for local debugging.
- Correction: an interim `$(BIN_DIR)/wait-on tcp:` probe passed locally but failed every CI job
  (`static`, `unit`, `integration`, `mutation-testing`, `codecov`, `performance`) in ~1ms because
  `./node_modules/.bin/wait-on` is not installed on the CI host. Reverted to the host `curl` poll.

### File List

- `specs/start-ci-chromium/implementation-artifacts/1-3-add-mockoon-readiness-and-failure-output.md`
- `tests/unit/tooling/mockoon-readiness.test.ts`
- `tests/unit/tooling/make-start.test.ts`
- `Makefile`
