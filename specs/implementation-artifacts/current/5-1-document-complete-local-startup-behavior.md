# Story 5.1: Document Complete Local Startup Behavior

Status: review

## Story

As a developer,
I want README documentation for the updated `make start` behavior,
so that I know the command starts both the frontend and Mockoon API mock and what ports to use.

## Acceptance Criteria

1. README startup documentation states that `make start` starts both `dev` and `mockoon`.
2. README startup documentation states that the frontend is available on port `3000`.
3. README startup documentation states that the Mockoon API mock is available on port `8080`.
4. README startup documentation no longer implies Mockoon only starts for E2E workflows.

## Tasks / Subtasks

- [x] Task 1: Update the primary startup section in the README (AC: 1, 2, 3)
  - [x] 1.1 Document that `make start` starts both the frontend and Mockoon containers.
  - [x] 1.2 Document the frontend port.
  - [x] 1.3 Document the Mockoon port.
  - [x] 1.4 Document that readiness waits complete before the command returns.

- [x] Task 2: Remove conflicting startup language elsewhere in the README (AC: 1, 4)
  - [x] 2.1 Update the Mockoon testing note so it reflects shared local startup behavior.
  - [x] 2.2 Keep E2E-related Mockoon usage documented without implying it is the only startup path.

## Dev Notes

### Architecture Decisions

- **README-only scope:** This story documents existing behavior without changing the Makefile or
  Docker orchestration.
- **Single source of behavior:** The README now mirrors the already-implemented `make start`
  contract that starts `dev` and `mockoon` together and waits for both readiness checks.
- **Conflict removal:** The Swagger/Mockoon section was updated because it previously implied a
  test-only startup path that contradicted the current local development flow.

### Project Structure Notes

- **Primary file:** `README.md`
- **Supporting verification target:** `tests/unit/tooling/make-start.test.ts`
- **Supporting tracking artifact:** `specs/implementation-artifacts/current/sprint-status.yaml`

### Testing Approach

- Run markdown lint on `README.md` to verify the documentation edits remain valid.
- Re-run the existing `make start` tooling contract test to confirm the documented behavior still
  matches the implemented command.

## Dev Agent Record

### Agent Model Used

gpt-5-codex

### Debug Log References

- Inspected the README startup section and found it still described `make start` as bringing up
  only the `dev` container.
- Found a second conflicting README note that described Mockoon as automatically starting only for
  E2E tests.
- Updated both sections and verified the docs against the existing startup contract test.

### Completion Notes List

- Documented that `make start` brings up both the frontend and Mockoon.
- Documented the local startup ports for the frontend and the mock API.
- Removed misleading README wording that framed Mockoon as an E2E-only startup concern.

### File List

- `README.md`
- `specs/implementation-artifacts/current/5-1-document-complete-local-startup-behavior.md`
- `specs/implementation-artifacts/current/sprint-status.yaml`
