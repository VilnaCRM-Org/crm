# Story 4.3: Remove Obsolete Lighthouse Build Command Wiring

Status: review

## Story

As a maintainer,
I want obsolete Lighthouse setup wiring removed,
so that future Lighthouse targets cannot accidentally reintroduce duplicate Chromium checks.

## Acceptance Criteria

1. Obsolete Lighthouse build-command setup wiring is removed from the Makefile.
2. Desktop and mobile Lighthouse targets still use the shared `lighthouse-setup` path.
3. Desktop and mobile Lighthouse LHCI commands remain direct `lhci autorun` invocations without the
   deleted setup indirection.

## Tasks / Subtasks

- [x] Task 1: Lock the dead-wire cleanup with focused tooling coverage (AC: 1, 2, 3)
  - [x] 1.1 Add a test that asserts the Makefile no longer contains `LHCI_BUILD_CMD`.
  - [x] 1.2 Assert the Makefile still defines direct `LHCI_DESKTOP` and `LHCI_MOBILE` commands.

- [x] Task 2: Remove the obsolete Makefile wiring (AC: 1, 2, 3)
  - [x] 2.1 Delete the unused `LHCI_BUILD_CMD` variable.
  - [x] 2.2 Preserve the shared `lighthouse-setup` target and the rewired public audit targets.

## Dev Notes

### Architecture Decisions

- **Dead-code removal only:** This story removes only the obsolete intermediate setup variable. The
  functional shared setup path introduced in Stories 4.1 and 4.2 remains unchanged.
- **Regression guard:** The cleanup test prevents future reintroduction of the deleted setup
  indirection while still allowing the direct `lhci autorun` variables to evolve.
- **Public target stability:** No user-facing target names changed in this story; this is strictly
  internal Makefile cleanup after the shared setup migration.

### Project Structure Notes

- **Primary file:** `Makefile`
- **Focused test file:** `tests/unit/tooling/lighthouse-build-command-cleanup.test.ts`
- **Supporting tracking artifact:** `specs/implementation-artifacts/current/sprint-status.yaml`

### Testing Approach

- Read the Makefile as source text to assert the obsolete symbol is gone.
- Re-run the public Lighthouse target dry-run tests plus the shared setup dry-run test to confirm
  the cleanup did not change the observable target contracts.

## Dev Agent Record

### Agent Model Used

gpt-5-codex

### Debug Log References

- Added the cleanup contract test before deleting the obsolete variable and confirmed it failed
  because `LHCI_BUILD_CMD` was still present in the Makefile.
- Removed the dead variable and re-ran the cleanup test until it passed.
- Re-ran the target dry-run tests to verify the shared setup flow remained unchanged after cleanup.

### Completion Notes List

- Removed the obsolete `LHCI_BUILD_CMD` Makefile wiring.
- Preserved the shared `lighthouse-setup` workflow and the direct desktop/mobile LHCI commands.
- Added a focused cleanup test to prevent the dead setup indirection from returning.

### File List

- `Makefile`
- `tests/unit/tooling/lighthouse-build-command-cleanup.test.ts`
- `specs/implementation-artifacts/current/4-3-remove-obsolete-lighthouse-build-command-wiring.md`
- `specs/implementation-artifacts/current/sprint-status.yaml`
