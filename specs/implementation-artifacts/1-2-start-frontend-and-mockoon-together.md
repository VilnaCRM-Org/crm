# Story 1.2: Start Frontend and Mockoon Together

Status: ready-for-dev

## Story

As a developer,
I want `make start` to start both the frontend dev server and Mockoon,
so that the local app works with mock API responses after one command.

## Acceptance Criteria

1. `make start` starts both `dev` and `mockoon`.
2. `make start` waits for frontend readiness.
3. `make start` waits for Mockoon readiness.
4. The frontend is reachable on port `3000`.
5. Mockoon is reachable on port `8080`.

## Tasks / Subtasks

- [ ] Task 1: Lock the `make start` contract with focused tooling coverage (AC: 1, 2, 3)
  - [ ] 1.1 Add or finalize a focused tooling test for `make -n start`.
  - [ ] 1.2 Assert the printed startup command includes both `dev` and `mockoon`.
  - [ ] 1.3 Assert the printed startup flow invokes `make wait-for-dev`.
  - [ ] 1.4 Assert the printed startup flow invokes `make wait-for-mockoon`.

- [ ] Task 2: Update the shared development startup command (AC: 1, 2, 3)
  - [ ] 2.1 Modify the shared Makefile startup command so Docker Compose starts `dev mockoon`.
  - [ ] 2.2 Ensure `start` runs the frontend readiness wait.
  - [ ] 2.3 Ensure `start` runs the Mockoon readiness wait.

- [ ] Task 3: Verify the updated startup contract (AC: 1, 2, 3, 4, 5)
  - [ ] 3.1 Run the focused tooling test for `make start`.
  - [ ] 3.2 Inspect the final `make -n start` output to confirm the command order.
  - [ ] 3.3 Defer live readiness semantics and failure-output refinement to Story 1.3 if only the
        external wait target implementation remains.

## Dev Notes

### Architecture Decisions

- **Startup contract:** `make start` must bring up both `dev` and `mockoon`.
- **Expected recipe shape:**

```makefile
start: create-network ## Start the application (frontend + Mockoon API mock)
    $(DOCKER_COMPOSE) $(DOCKER_COMPOSE_DEV_FILE) up -d --build dev mockoon
    make wait-for-dev
    make wait-for-mockoon
```

- **Scope boundary:** This story owns co-start behavior for `make start`. Story 1.3 owns the
  detailed `wait-for-mockoon` target contract and user-facing success/failure messaging. Story 1.4
  owns `start-prod` fallout from the Mockoon topology move.
- **Dependency chain:** This story assumes Story 1.1's compose ownership move is in place so
  `DOCKER_COMPOSE_DEV_FILE` can legally start `mockoon`.

### Project Structure Notes

- **Primary file:** `Makefile`
- **Focused test file:** `tests/unit/tooling/make-start.test.ts`
- **Current repository state:** The worktree already contains a focused tooling test for
  `make -n start` and in-progress Makefile changes. Use the BMAD story file as the implementation
  artifact of record; do not use `docs/plans/*.md` as the artifact destination.

### Testing Approach

- Use a tooling-level unit test that shells `make -n start` and asserts the printed recipe.
- Verify both service names are present in the Docker Compose command.
- Verify both readiness waits are present in the startup flow.
- Live readiness behavior and timeout messaging are refined in Story 1.3.

### References

- Architecture: `specs/planning-artifacts/architecture-ci-chromium-2026-04-14.md`
  - `Docker Compose Topology`
  - `Mockoon Health Check`
  - `Decision Impact Analysis`
- Epics: `specs/planning-artifacts/epics-start-ci-chromium-2026-04-14.md`
  - `Epic 1 Stories: Complete Local Development Startup`
  - `Story 1.2: Start Frontend and Mockoon Together`
- PRD: `specs/planning-artifacts/prd-start-ci-chromium-2026-04-10.md`
  - `Dev Environment Setup`
  - `FR1`, `FR2`, `FR3`, `FR4`, `FR6`

## Dev Agent Record

### Agent Model Used

gpt-5-codex

### Debug Log References

- Confirmed the worktree already contains `tests/unit/tooling/make-start.test.ts`, which asserts
  that `make start` starts `dev mockoon` and waits for both readiness checks.
- Confirmed the current Makefile still defines the shared dev startup command around `dev` only,
  so the story artifact is needed even though implementation work has already started in the
  worktree.

### Completion Notes List

- Created the BMAD story artifact for Story 1.2 in the configured implementation artifact set.
- Kept the implementation artifact source of truth under `specs/implementation-artifacts`.

### File List

- `specs/implementation-artifacts/1-2-start-frontend-and-mockoon-together.md`
- `tests/unit/tooling/make-start.test.ts`
- `Makefile`
