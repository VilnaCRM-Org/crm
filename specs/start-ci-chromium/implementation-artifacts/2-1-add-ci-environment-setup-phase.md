# Story 2.1: Add CI Environment Setup Phase

Status: review

## Story

As a developer,
I want `make ci` to prepare the required local environment once,
so that all CI checks run against a ready and consistent dev stack.

## Acceptance Criteria

1. `ci-setup` depends on `create-network`.
2. `ci-setup` starts `dev` and `mockoon`.
3. `ci-setup` uses `docker compose -f docker-compose.yml up -d --build dev mockoon` when
   `CI=1`.
4. `ci-setup` uses `docker compose -f docker-compose.yml up -d --no-recreate dev mockoon`
   outside CI.
5. `ci-setup` runs `wait-for-dev`.
6. `ci-setup` runs `wait-for-mockoon`.

## Tasks / Subtasks

- [ ] Task 1: Lock the `ci-setup` startup contract with tooling coverage (AC: 1, 2, 3, 4, 5, 6)
  - [ ] 1.1 Add a focused tooling test for `make -n ci-setup`.
  - [ ] 1.2 Assert the default command path creates the network and reuses `dev mockoon`.
  - [ ] 1.3 Assert the `CI=1` command path rebuilds `dev mockoon`.
  - [ ] 1.4 Assert both paths still invoke `make wait-for-dev` and `make wait-for-mockoon`.

- [ ] Task 2: Introduce a dedicated CI environment setup target (AC: 1, 2, 3, 4, 5, 6)
  - [ ] 2.1 Add a shared service list for the CI setup phase.
  - [ ] 2.2 Add a default idempotent `ci-setup` command path for local reuse.
  - [ ] 2.3 Override the startup flags when `CI=1` so CI gets a fresh build once.
  - [ ] 2.4 Keep the readiness waits inside the shared `ci-setup` command.

- [ ] Task 3: Verify the new prerequisite contract (AC: 3, 4, 5, 6)
  - [ ] 3.1 Run the focused `ci-setup` tooling test and watch it fail before the Makefile change.
  - [ ] 3.2 Re-run the same test after the Makefile change and confirm it passes.
  - [ ] 3.3 Inspect `make -n ci-setup` and `CI=1 make -n ci-setup` output to confirm both
        command variants.

## Dev Notes

### Architecture Decisions

- **Scope boundary:** This story introduces only the shared environment setup prerequisite for later
  CI orchestration. It does not yet add `ci`, `ci-lint`, or `ci-test`.
- **Freshness split:** Local reruns should reuse the existing `dev mockoon` stack with
  `--no-recreate`, while CI should get a fresh setup by setting `CI=1`.
- **Service boundary:** The setup phase uses only the development compose stack because the CI
  stories in this epic are about linting and unit/integration checks against the dev environment.
- **Readiness contract:** `ci-setup` owns the external waits so later CI phases can assume the
  environment is already ready.

### Project Structure Notes

- **Primary file:** `Makefile`

### Testing Approach

- Use a tooling-level unit test that shells `make -n ci-setup` and checks the printed recipe.
- Verify both the default path and the `CI=1` path in the same focused test file.
- Confirm the red-green cycle with a failing run before the Makefile change and a passing run after.

### References

- Prior loop context: Story 1.4 completed the shared Mockoon production startup contract, so this
  story builds on the existing `dev mockoon` startup path without re-reading the planning specs.

## Dev Agent Record

### Agent Model Used

gpt-5-codex

### Debug Log References

- Verified the repository had no `ci-setup` recipe yet, so `make -n ci-setup` returned
  "Nothing to be done for 'ci-setup'".
- Reproduced the missing contract with a focused tooling test that checks the default and `CI=1`
  command variants.
- Confirmed the final `make -n ci-setup` output uses `--no-recreate`, while
  `CI=1 make -n ci-setup` uses `--build`.

### Completion Notes List

- Added focused tooling coverage for the `ci-setup` startup contract.
- Introduced a dedicated Makefile target for CI environment setup with separate local and CI flag
  paths.
- Kept the shared readiness gates inside `ci-setup` so later CI stories can assume a ready dev
  stack.

### File List

- `specs/start-ci-chromium/implementation-artifacts/2-1-add-ci-environment-setup-phase.md`
- `Makefile`
