# Story 1.4: Preserve Production Test Startup After the Mockoon Move

Status: review

## Story

As a developer running test and production-like workflows,
I want `start-prod` to keep starting everything its dependent targets need,
so that e2e, visual, load, memory, and Lighthouse workflows do not regress.

## Acceptance Criteria

1. `make start-prod` composes `docker-compose.yml`, `docker-compose.test.yml`, and
   `common-healthchecks.yml`.
2. `make start-prod` starts the explicit services `prod mockoon playwright`.
3. `make start-prod` uses `--no-recreate` for idempotent reuse.
4. `make start-prod` still runs `wait-for-prod-health`.
5. `start-prod` dependent targets retain access to `prod`, `mockoon`, and `playwright`.
6. CI freshness is handled outside `start-prod`; production-like test targets keep the idempotent
   reuse path.

## Tasks / Subtasks

- [ ] Task 1: Lock the production startup contract with tooling coverage (AC: 1, 2, 3, 4, 5, 6)
  - [ ] 1.1 Add a focused tooling test for the `start-prod` dry-run output.
  - [ ] 1.2 Assert the command composes the shared dev and test compose files plus the common
        healthchecks overlay.
  - [ ] 1.3 Assert the command starts `prod mockoon playwright`.
  - [ ] 1.4 Assert the command keeps `--no-recreate` and still invokes `wait-for-prod-health`.

- [ ] Task 2: Preserve the production-like startup wiring in Make (AC: 1, 2, 3, 4, 5, 6)
  - [ ] 2.1 Keep `start-prod` on the shared compose stack after Mockoon moved to
        `docker-compose.yml`.
  - [ ] 2.2 Keep the explicit service list aligned with the workflows that depend on `start-prod`.
  - [ ] 2.3 Keep the startup path idempotent for repeated e2e, visual, load, memory, and
        Lighthouse runs.

- [ ] Task 3: Verify adjacent startup contracts remain aligned (AC: 1, 2, 3, 4, 5, 6)
  - [ ] 3.1 Run the focused `start-prod` tooling test and watch it fail before the contract is
        locked.
  - [ ] 3.2 Re-run the same test after the Makefile change and confirm it passes.
  - [ ] 3.3 Re-run the adjacent `make start` and `wait-for-mockoon` tooling tests to confirm the
        earlier Story 1.2 and 1.3 contracts still hold.

## Dev Notes

### Architecture Decisions

- **Shared topology:** `start-prod` must compose both `docker-compose.yml` and
  `docker-compose.test.yml` because `mockoon` now lives in the shared development compose file while
  `prod` and `playwright` remain test-only services.
- **Explicit service contract:** Start only `prod mockoon playwright` so the public Make target
  continues to provide exactly the services production-like browser and load workflows rely on.
- **Idempotent reuse:** Keep `--no-recreate` on `start-prod` so repeated workflow invocations reuse
  the existing environment; CI freshness is handled separately by later `ci-*` work.
- **Scope boundary:** This story owns the `start-prod` fallout from the Mockoon topology move. It
  does not change the existing `wait-for-prod-health` implementation or broader CI orchestration.

### Project Structure Notes

- **Primary file:** `Makefile`
- **Focused test file:** `tests/unit/tooling/start-prod.test.ts`
- **Regression checks:** `tests/unit/tooling/make-start.test.ts`,
  `tests/unit/tooling/mockoon-readiness.test.ts`

### Testing Approach

- Use a tooling-level unit test that dry-runs `make start-prod` and asserts the exact startup
  command contract.
- Verify the red-green cycle on the new tooling test before treating the story as complete.
- Re-run the adjacent startup tooling tests to confirm the Story 1.2 and 1.3 behavior still holds
  after locking the production startup contract.

### References

- Architecture: `specs/planning-artifacts/current/architecture-ci-chromium-2026-04-14.md`
  - `Make Targets as Contracts`
  - `Environment Ownership`
- Epics: `specs/planning-artifacts/current/epics-start-ci-chromium-2026-04-14.md`
  - `Epic 1 Stories: Complete Local Development Startup`
  - `Story 1.4: Preserve Production Test Startup After the Mockoon Move`
- PRD: `specs/planning-artifacts/current/prd-start-ci-chromium-2026-04-10.md`
  - `FR1`
  - `FR2`
  - `FR3`

## Dev Agent Record

### Agent Model Used

gpt-5-codex

### Debug Log References

- Confirmed the unchecked Story 1.4 maps to the existing `start-prod` regression after `mockoon`
  moved from `docker-compose.test.yml` into `docker-compose.yml`.
- Verified the red test initially failed because the dry-run output still showed the old compose
  stack without `docker-compose.yml` or explicit services.
- Confirmed the current Makefile wiring in the worktree now composes the shared stack and starts
  `prod mockoon playwright`, so the missing work in this loop was locking that behavior with a
  focused tooling test and story bookkeeping.
- Worked around an unrelated local Jest coverage write-permission problem by running the focused
  verification with `--coverage=false`.

### Completion Notes List

- Created the BMAD story artifact for Story 1.4 in the configured implementation artifact set.
- Added a focused tooling test that locks the `start-prod` compose stack, service list,
  idempotency flag, and prod-health wait.
- Verified the adjacent `make start` and `wait-for-mockoon` tooling contracts still pass.

### File List

- `specs/implementation-artifacts/current/1-4-preserve-production-test-startup-after-the-mockoon-move.md`
- `specs/implementation-artifacts/current/sprint-status.yaml`
- `tests/unit/tooling/start-prod.test.ts`
- `Makefile`
