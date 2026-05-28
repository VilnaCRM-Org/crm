# Story 2.4: Add Top-Level make ci Orchestration

Status: review

## Story

As a developer,
I want one `make ci` command that runs setup, lint, and tests in the correct order,
so that I get a definitive local CI result before pushing.

## Acceptance Criteria

1. A top-level `ci` target exists.
2. `ci` runs `ci-setup`.
3. `ci` runs `ci-lint`.
4. `ci` runs `ci-test`.
5. The phases run in the correct order: setup, then lint, then tests.

## Tasks / Subtasks

- [ ] Task 1: Lock the `make ci` orchestration contract with focused tooling coverage
      (AC: 1, 2, 3, 4, 5)
  - [ ] 1.1 Add a tooling test for `make -n ci`.
  - [ ] 1.2 Assert the output includes `make ci-setup`, `make ci-lint`, and `make ci-test`.
  - [ ] 1.3 Assert the commands appear in setup → lint → test order.

- [ ] Task 2: Add the top-level Makefile orchestration target (AC: 1, 2, 3, 4, 5)
  - [ ] 2.1 Add a public `ci` target to the Makefile.
  - [ ] 2.2 Delegate to `ci-setup`, `ci-lint`, and `ci-test` in order.
  - [ ] 2.3 Keep the orchestration intentionally thin so future CI workflows can reuse it directly.

## Dev Notes

### Architecture Decisions

- **Thin orchestration:** `ci` should only sequence the already-defined phases and should not
  duplicate their implementation details.
- **Explicit order:** Use a recipe-based sequence instead of relying on Make parallel prerequisite
  execution so the phase order is stable and obvious.
- **Phase reuse:** `ci` becomes the canonical local CI entrypoint that Story 3.1 can later reuse in
  GitHub Actions unchanged.

### Project Structure Notes

- **Primary file:** `Makefile`
- **Focused test file:** `tests/unit/tooling/ci.test.ts`
- **Supporting artifact:** `specs/implementation-artifacts/current/sprint-status.yaml`

### Testing Approach

- Use `make -n ci` to verify the exact orchestration sequence without running the full stack.
- Keep the test focused on the top-level contract only; the phase-specific behavior is already
  covered in the prior stories.

### References

- Prior loop context: Stories 2.1, 2.2, and 2.3 already established the `ci-setup`, `ci-lint`, and
  `ci-test` phases. This story only composes them into the canonical local entrypoint.

## Dev Agent Record

### Agent Model Used

gpt-5-codex

### Debug Log References

- Verified that the repository had no top-level `ci` target yet, so `make -n ci` initially
  returned "Nothing to be done for 'ci'".
- Reproduced the missing orchestration with a focused tooling test expecting the three phase
  invocations in order.
- Confirmed the final `make -n ci` output expands to `make ci-setup`, `make ci-lint`, and
  `make ci-test` in sequence.

### Completion Notes List

- Added the canonical top-level `ci` target to the Makefile.
- Kept the orchestration thin by delegating directly to the existing CI phases.
- Added focused tooling coverage for the phase order contract.

### File List

- `specs/implementation-artifacts/current/2-4-add-top-level-make-ci-orchestration.md`
- `specs/implementation-artifacts/current/sprint-status.yaml`
- `tests/unit/tooling/ci.test.ts`
- `Makefile`
