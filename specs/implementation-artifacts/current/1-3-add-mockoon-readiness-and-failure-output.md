# Story 1.3: Add Mockoon Readiness and Failure Output

Status: review

## Story

As a developer,
I want clear readiness and failure output for Mockoon startup,
so that I know whether the local API mock is ready or why startup failed.

## Acceptance Criteria

1. `MOCKOON_PORT ?= 8080` is defined near the existing port variables.
2. `wait-for-mockoon` probes `tcp:$(WEBSITE_DOMAIN):$(MOCKOON_PORT)`.
3. The probe uses a `60000` ms timeout.
4. The target prints a waiting message before probing.
5. The target prints a success message when Mockoon is ready.
6. The target exits non-zero with a clear failure message when Mockoon is not ready.

## Tasks / Subtasks

- [ ] Task 1: Lock the Mockoon readiness contract with tooling coverage (AC: 1, 2, 3, 4, 5, 6)
  - [ ] 1.1 Add a focused tooling test for the `wait-for-mockoon` target definition.
  - [ ] 1.2 Assert the Makefile keeps `MOCKOON_PORT ?= 8080` alongside the other public
        port variables.
  - [ ] 1.3 Assert the readiness check uses `wait-on tcp:$(WEBSITE_DOMAIN):$(MOCKOON_PORT)`.
  - [ ] 1.4 Assert the probe uses `--timeout 60000`.
  - [ ] 1.5 Assert the target prints explicit waiting, success, and failure output.

- [ ] Task 2: Implement the external readiness gate (AC: 2, 3, 4, 5, 6)
  - [ ] 2.1 Replace the HTTP polling loop with a `wait-on` TCP probe.
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

- **Readiness mechanism:** Use `wait-on` against `tcp:$(WEBSITE_DOMAIN):$(MOCKOON_PORT)` instead of
  an HTTP probe. This matches the selected architecture direction and keeps the external contract
  consistent with the existing wait-target patterns.
- **Execution boundary:** Run the TCP probe from the host-side `node_modules/.bin/wait-on` binary
  rather than through `$(BUNX)`, because `localhost:$(MOCKOON_PORT)` must resolve to the published
  host port, not the `dev` container loopback interface.
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

- Architecture: `specs/planning-artifacts/current/architecture-ci-chromium-2026-04-14.md`
  - `Mockoon Health Check`
  - `Naming Patterns`
- Epics: `specs/planning-artifacts/current/epics-start-ci-chromium-2026-04-14.md`
  - `Epic 1 Stories: Complete Local Development Startup`
  - `Story 1.3: Add Mockoon Readiness and Failure Output`
- PRD: `specs/planning-artifacts/current/prd-start-ci-chromium-2026-04-10.md`
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
- Replaced the Mockoon wait loop with a `wait-on` TCP readiness gate and explicit startup messages.
- Preserved Mockoon logs in the failure path for local debugging.

### File List

- `specs/implementation-artifacts/current/1-3-add-mockoon-readiness-and-failure-output.md`
- `specs/implementation-artifacts/current/sprint-status.yaml`
- `tests/unit/tooling/mockoon-readiness.test.ts`
- `tests/unit/tooling/make-start.test.ts`
- `Makefile`
