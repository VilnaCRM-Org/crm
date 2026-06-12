# Story 1.1: Move Mockoon Into the Development Compose Topology

Status: ready-for-dev

## Story

As a developer,
I want Mockoon to be part of the development compose stack,
so that local startup and test startup can share the same stable Mockoon service.

## Acceptance Criteria

1. `docker-compose.yml` defines the `mockoon` service.
2. `docker-compose.test.yml` no longer owns the `mockoon` service.
3. The service name remains exactly `mockoon`.
4. Existing `patch-prod-mockoon-url` references remain valid after the topology move.

## Tasks / Subtasks

- [ ] Task 1: Re-home Mockoon into the development compose file (AC: 1, 2, 3)
  - [ ] 1.1 Compare the current `mockoon` service contract before changing files.
  - [ ] 1.2 Keep the service name `mockoon`, existing port mapping, healthcheck, restart policy, and
        network membership intact.
  - [ ] 1.3 Ensure `docker-compose.yml` owns the `mockoon` service definition.
  - [ ] 1.4 Remove the `mockoon` service definition from `docker-compose.test.yml`.

- [ ] Task 2: Preserve dependent references (AC: 3, 4)
  - [ ] 2.1 Verify `patch-prod-mockoon-url` still targets `mockoon` by service name.
  - [ ] 2.2 Confirm no compose or Makefile references depend on a different Mockoon service name.

- [ ] Task 3: Verify the compose topology after the move (AC: 1, 2, 3, 4)
  - [ ] 3.1 Run `docker compose -f docker-compose.yml config`.
  - [ ] 3.2 Run `docker compose -f docker-compose.test.yml config`.
  - [ ] 3.3 Confirm the development compose file resolves `mockoon` and the test compose file does
        not define it.

## Dev Notes

### Architecture Decisions

- **Topology decision:** Move the Mockoon service definition to `docker-compose.yml` and remove it
  from `docker-compose.test.yml`.
- **Why this is the selected pattern:** Mockoon is a development dependency, so the dev compose
  file should own it. This lets later stories update `make start` without introducing extra compose
  flags.
- **Scope boundary:** Do not fold `make start` or `start-prod` behavior changes into this story.
  `make start` co-start and readiness work belongs to Story 1.2 and Story 1.3; `start-prod`
  compose wiring belongs to Story 1.4.
- **Contract stability:** Preserve the service name `mockoon` so `patch-prod-mockoon-url` and later
  `start-prod` service selection remain valid.

### Project Structure Notes

- **Primary files:** `docker-compose.yml`, `docker-compose.test.yml`
- **Inspect-only dependency:** `Makefile` target `patch-prod-mockoon-url`
- **Current repository state:** The current snapshot already appears to place `mockoon` in
  `docker-compose.yml` and not in `docker-compose.test.yml`. Treat this artifact as the BMAD story
  record for that work and verify the Compose contract before making additional edits.

### Testing Approach

- Validate both compose files with `docker compose ... config`.
- Search for `mockoon` references in `Makefile` and compose files to confirm the service name
  remains stable.
- Defer `make start` and `start-prod` runtime verification to Stories 1.2 through 1.4, which own
  those behaviors.

### References

- Architecture: `specs/start-ci-chromium/planning-artifacts/architecture-ci-chromium-2026-04-14.md`
  - `Docker Compose Topology`
  - `Decision Impact Analysis`
- Epics: `specs/start-ci-chromium/planning-artifacts/epics-start-ci-chromium-2026-04-14.md`
  - `Epic 1 Stories: Complete Local Development Startup`
  - `Story 1.1: Move Mockoon Into the Development Compose Topology`
- PRD: `specs/start-ci-chromium/planning-artifacts/prd-start-ci-chromium-2026-04-10.md`
  - `Dev Environment Setup`
  - `FR1`, `FR2`, `FR3`

## Dev Agent Record

### Agent Model Used

gpt-5-codex

### Debug Log References

- Confirmed the current repository snapshot already defines `mockoon` in `docker-compose.yml`.
- Confirmed `docker-compose.test.yml` does not currently define `mockoon`.
- Confirmed `start-prod` still composes only the test file; that follow-up belongs to Story 1.4,
  not Story 1.1.

### Completion Notes List

- Created the BMAD story artifact for Story 1.1 in the configured implementation artifact set.
- Updated sprint tracking so Epic 1 is now active and Story 1.1 is `ready-for-dev`.

### File List

- `specs/start-ci-chromium/implementation-artifacts/1-1-move-mockoon-into-the-development-compose-topology.md`
