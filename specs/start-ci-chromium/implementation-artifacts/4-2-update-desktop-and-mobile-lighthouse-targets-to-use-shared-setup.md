# Story 4.2: Update Desktop and Mobile Lighthouse Targets to Use Shared Setup

Status: review

## Story

As a developer running desktop and mobile Lighthouse audits,
I want both audit targets to use the shared setup path,
so that sequential audit runs do not repeat Chromium setup unnecessarily.

## Acceptance Criteria

1. `lighthouse-desktop` uses `lighthouse-setup`.
2. `lighthouse-mobile` uses `lighthouse-setup`.
3. The desktop audit command no longer inlines `make ensure-chromium` through `LHCI_BUILD_CMD`.
4. The mobile audit command no longer inlines `make ensure-chromium` through `LHCI_BUILD_CMD`.

## Tasks / Subtasks

- [x] Task 1: Lock the rewired audit-target contract with focused tooling coverage (AC: 1, 2, 3, 4)
  - [x] 1.1 Add a dry-run tooling test for `make lighthouse-desktop`.
  - [x] 1.2 Add a dry-run tooling test for `make lighthouse-mobile`.
  - [x] 1.3 Assert both outputs include the shared `ensure-chromium` and `start-prod` setup steps.
  - [x] 1.4 Assert neither output inlines `make ensure-chromium && make start-prod &&` in the LHCI command.

- [x] Task 2: Rewire the public Lighthouse audit targets (AC: 1, 2, 3, 4)
  - [x] 2.1 Make `lighthouse-desktop` depend on `lighthouse-setup`.
  - [x] 2.2 Make `lighthouse-mobile` depend on `lighthouse-setup`.
  - [x] 2.3 Run each target's LHCI command without the old inline setup prefix.

## Dev Notes

### Architecture Decisions

- **Shared setup first:** The public desktop and mobile Lighthouse targets now route through
  `lighthouse-setup` instead of embedding setup in the LHCI command text.
- **Incremental cleanup:** The obsolete `LHCI_BUILD_CMD` symbol is intentionally left in place for
  Story 4.3, which owns the final cleanup of dead setup wiring.
- **Target stability:** The actual LHCI desktop/mobile flags remain unchanged; only the setup path
  changed in this story.

### Project Structure Notes

- **Primary file:** `Makefile`
- **Focused test file:** `tests/unit/tooling/lighthouse-targets.test.ts`

### Testing Approach

- Use `make -n lighthouse-desktop` and `make -n lighthouse-mobile` to confirm both public targets
  expand through the shared setup path.
- Re-run the existing `lighthouse-setup` contract test because the rewired targets depend on it.

## Dev Agent Record

### Agent Model Used

gpt-5-codex

### Debug Log References

- Added the Lighthouse target contract test before rewiring and confirmed both dry runs still
  contained the old inline `make ensure-chromium && make start-prod &&` prefix.
- Rewired the public targets to depend on `lighthouse-setup` and re-ran the target contract test
  until both dry runs passed.
- Re-ran the `lighthouse-setup` contract test to confirm the shared prerequisite remains intact.

### Completion Notes List

- Rewired `lighthouse-desktop` and `lighthouse-mobile` to use `lighthouse-setup`.
- Removed the inline setup prefix from the public LHCI command paths without changing their
  viewport-specific configuration flags.
- Left final dead-wire cleanup for Story 4.3.

### File List

- `Makefile`
- `tests/unit/tooling/lighthouse-targets.test.ts`
- `specs/start-ci-chromium/implementation-artifacts/4-2-update-desktop-and-mobile-lighthouse-targets-to-use-shared-setup.md`
