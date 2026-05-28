# Story 2.2: Add Parallel Lint Phase

Status: review

## Story

As a developer,
I want lint checks to run in a single composable CI phase,
so that local CI feedback is faster without hiding individual failures.

## Acceptance Criteria

1. `ci-lint` runs the lint targets as one dedicated phase.
2. `ci-lint` executes `lint-eslint`, `lint-tsc`, `lint-md`, and `lint-metrics`.
3. The lint targets run in parallel.
4. Output remains grouped per target.
5. A failed lint target causes `ci-lint` to fail.

## Tasks / Subtasks

- [ ] Task 1: Lock the `ci-lint` contract with focused tooling coverage (AC: 1, 2, 3, 4, 5)
  - [ ] 1.1 Add a tooling test for `make -n ci-lint`.
  - [ ] 1.2 Assert the Makefile delegates to a grouped parallel lint runner.
  - [ ] 1.3 Verify the runner prints grouped output in target order even when work completes out of
        order.
  - [ ] 1.4 Verify a failed lint target causes the runner to exit non-zero.

- [ ] Task 2: Introduce the grouped parallel lint runner (AC: 2, 3, 4, 5)
  - [ ] 2.1 Add a `scripts/ci/run-parallel-lint.sh` helper that accepts lint targets as arguments.
  - [ ] 2.2 Run the requested targets in parallel using the configured `make` binary.
  - [ ] 2.3 Capture each target's output separately and print it in grouped sections.
  - [ ] 2.4 Return a failing exit code when any grouped target fails.

- [ ] Task 3: Wire the new lint phase into the Makefile (AC: 1, 2)
  - [ ] 3.1 Add a shared target list for the CI lint phase.
  - [ ] 3.2 Add `ci-lint` as a dedicated Makefile phase that delegates to the new runner.
  - [ ] 3.3 Keep `ci-lint` composable so later top-level `ci` orchestration can order it after
        `ci-setup`.

## Dev Notes

### Architecture Decisions

- **Composability:** `ci-lint` intentionally does not depend on `ci-setup`; Story 2.4 will own the
  top-level orchestration order. This keeps the phase reusable and avoids forcing repeated setup.
- **Grouping strategy:** Run lint targets concurrently but buffer each target into its own log file,
  then print logs in target-list order so output stays grouped and readable.
- **Failure strategy:** Return exit code `1` when any grouped target fails, while still printing all
  collected target output for diagnosis.
- **Testability:** The runner honors `MAKE_BIN` so the grouped behavior can be exercised in unit
  tests with a fake `make` implementation.

### Project Structure Notes

- **Primary files:** `Makefile`, `scripts/ci/run-parallel-lint.sh`

### Testing Approach

- Use `make -n ci-lint` to verify the Makefile delegates to the grouped runner.
- Use a fake `make` script in Jest to verify grouped output and failure propagation without running
  the real lint suite.
- Keep the red-green cycle limited to the new tooling surface introduced in this story.

### References

- Prior loop context: Story 2.1 introduced `ci-setup`. This story builds the next composable CI
  phase on top of that setup contract without re-reading the planning specs.

## Dev Agent Record

### Agent Model Used

gpt-5-codex

### Debug Log References

- Verified the repository had no `ci-lint` target yet, so `make -n ci-lint` returned
  "Nothing to be done for 'ci-lint'".
- Reproduced the missing runner behavior with a focused test that expected a delegated script and
  grouped output from fake lint targets finishing out of order.
- Confirmed the final `make -n ci-lint` output delegates to
  `./scripts/ci/run-parallel-lint.sh lint-eslint lint-tsc lint-md lint-metrics`.

### Completion Notes List

- Added a dedicated grouped parallel lint runner under `scripts/ci/`.
- Added `ci-lint` as the composable Makefile phase for the four existing lint targets.
- Verified grouped output ordering and failure propagation with a focused tooling test.

### File List

- `specs/implementation-artifacts/2-2-add-parallel-lint-phase.md`
- `scripts/ci/run-parallel-lint.sh`
- `Makefile`
