# Story 2.3: Add Environment-Assuming Unit Test Phase

Status: review

## Story

As a developer,
I want unit tests to run in parallel without re-running `make start`,
so that `make ci` avoids Docker startup races and still verifies client and server tests.

## Acceptance Criteria

1. `ci-test` runs the client and server unit test phases as one dedicated CI phase.
2. `ci-test` runs `ci-test-unit-client` and `ci-test-unit-server` in parallel.
3. `ci-test-unit-client` assumes `ci-setup` already prepared the environment and does not re-run
   `make start`.
4. `ci-test-unit-server` assumes `ci-setup` already prepared the environment and does not re-run
   `make start`.
5. A failed grouped test target causes `ci-test` to fail.

## Tasks / Subtasks

- [ ] Task 1: Lock the `ci-test` contract with focused tooling coverage (AC: 1, 2, 3, 4, 5)
  - [ ] 1.1 Add a tooling test for `make -n ci-test`.
  - [ ] 1.2 Assert the client/server CI test subtargets execute without `make start`.
  - [ ] 1.3 Verify the grouped runner prints output by target name in a stable order.
  - [ ] 1.4 Verify a failed grouped test target causes `ci-test` to exit non-zero.

- [ ] Task 2: Add environment-assuming CI test targets (AC: 3, 4)
  - [ ] 2.1 Add a dedicated environment-assuming command prefix for CI test targets.
  - [ ] 2.2 Add `ci-test-unit-client` that reuses the prepared `dev` container.
  - [ ] 2.3 Add `ci-test-unit-server` that reuses the prepared `dev` container.
  - [ ] 2.4 Keep the existing manual `test-unit-*` targets unchanged.

- [ ] Task 3: Add the grouped parallel CI test phase (AC: 1, 2, 5)
  - [ ] 3.1 Add a grouped runner script for parallel CI test targets.
  - [ ] 3.2 Add `ci-test` as the composable Makefile phase delegating to that runner.
  - [ ] 3.3 Keep the phase ready for top-level `ci` orchestration in Story 2.4.

## Dev Notes

### Architecture Decisions

- **Scope boundary:** `ci-test` covers only client/server unit test phases. Top-level sequencing with
  `ci-setup` and `ci-lint` remains the responsibility of Story 2.4.
- **Startup avoidance:** The new `ci-test-unit-*` targets intentionally bypass `UNIT_TESTS`, which
  still shells through `make start` for manual workflows. This avoids repeated startup races during
  CI orchestration while preserving current local commands.
- **Grouping strategy:** Mirror the grouped-output pattern used by `ci-lint` so parallel test logs
  remain readable and deterministic.
- **Failure strategy:** Return exit code `1` when any grouped CI test target fails, while still
  printing all grouped output.

### Project Structure Notes

- **Primary files:** `Makefile`, `scripts/ci/run-parallel-tests.sh`
- **Focused test file:** `tests/unit/tooling/ci-test.test.ts`
- **Supporting artifact:** `specs/implementation-artifacts/current/sprint-status.yaml`

### Testing Approach

- Use `make -n ci-test` plus `make -n ci-test-unit-*` to verify the command contract.
- Use a fake `make` binary in Jest to verify grouped output ordering and failure propagation.
- Keep the red-green cycle isolated to the new CI test surface.

### References

- Prior loop context: Story 2.1 introduced `ci-setup`, and Story 2.2 added grouped parallel
  phase execution. This story builds the unit-test phase on top of that existing pattern.

## Dev Agent Record

### Agent Model Used

gpt-5-codex

### Debug Log References

- Verified that the repository had no `ci-test` phase and no environment-assuming unit test
  subtargets, so `make -n ci-test` and `make -n ci-test-unit-*` initially returned "Nothing to be
  done".
- Reproduced the missing runner behavior with a focused test that expected direct `docker compose
exec -T dev env ...` execution and grouped parallel output.
- Confirmed the final `make -n ci-test` output delegates to
  `./scripts/ci/run-parallel-tests.sh ci-test-unit-client ci-test-unit-server`.

### Completion Notes List

- Added environment-assuming CI test subtargets that bypass `make start`.
- Added a grouped parallel test runner under `scripts/ci/`.
- Added `ci-test` as the composable Makefile phase for client/server unit tests.

### File List

- `specs/implementation-artifacts/current/2-3-add-environment-assuming-unit-test-phase.md`
- `specs/implementation-artifacts/current/sprint-status.yaml`
- `tests/unit/tooling/ci-test.test.ts`
- `scripts/ci/run-parallel-tests.sh`
- `Makefile`
