# Story 4.1: Introduce Shared Lighthouse Setup Target

Status: review

## Story

As a developer running Lighthouse audits,
I want Lighthouse environment setup to happen through one shared prerequisite,
so that Chromium verification and production startup are not duplicated across audit targets.

## Acceptance Criteria

1. A shared `lighthouse-setup` Make target exists.
2. `lighthouse-setup` prepares Lighthouse prerequisites by running `ensure-chromium`.
3. `lighthouse-setup` prepares Lighthouse prerequisites by running `start-prod`.
4. The shared target sequences those prerequisites in a stable order so later audit targets can
   depend on one setup path.

## Tasks / Subtasks

- [x] Task 1: Lock the shared setup contract with focused tooling coverage (AC: 1, 2, 3, 4)
  - [x] 1.1 Add a dry-run tooling test for `make lighthouse-setup`.
  - [x] 1.2 Assert the output includes `make ensure-chromium`.
  - [x] 1.3 Assert the output includes `make start-prod`.
  - [x] 1.4 Assert `ensure-chromium` appears before `start-prod`.

- [x] Task 2: Add the shared setup target to the Makefile (AC: 1, 2, 3, 4)
  - [x] 2.1 Create a public `lighthouse-setup` target.
  - [x] 2.2 Keep the target intentionally thin by delegating to `ensure-chromium` and `start-prod`.
  - [x] 2.3 Preserve current desktop/mobile audit behavior until the follow-up wiring story.

## Dev Notes

### Architecture Decisions

- **Thin shared prerequisite:** `lighthouse-setup` only sequences existing setup behaviors. It does
  not duplicate their internals or change the current Lighthouse command wiring yet.
- **Stable order:** `ensure-chromium` runs before `start-prod` so Chromium availability is prepared
  before the production-like environment is brought up for Lighthouse runs.
- **Story boundary:** This story introduces the reusable setup path only. Story 4.2 will retarget
  `lighthouse-desktop` and `lighthouse-mobile` to depend on it.

### Project Structure Notes

- **Primary file:** `Makefile`
- **Focused test file:** `tests/unit/tooling/lighthouse-setup.test.ts`

### Testing Approach

- Use `make -n lighthouse-setup` to validate the orchestration contract without running Docker or
  Lighthouse itself.
- Re-run the existing `start-prod` contract test because the new setup target composes on top of
  that shared production startup path.

## Dev Agent Record

### Agent Model Used

gpt-5-codex

### Debug Log References

- Added the `make lighthouse-setup` tooling test before the target existed and confirmed the dry run
  failed with "Nothing to be done for 'lighthouse-setup'".
- Added the new shared target and re-ran the focused test until the dry-run contract passed.
- Re-ran the existing `start-prod` contract test to confirm the shared setup path still builds on
  the preserved production startup contract.

### Completion Notes List

- Added a shared `lighthouse-setup` Make target for Chromium and production startup preparation.
- Kept the target intentionally thin so future Lighthouse audit targets can reuse it directly.
- Deferred any `lighthouse-desktop` or `lighthouse-mobile` rewiring to the next story.

### File List

- `Makefile`
- `tests/unit/tooling/lighthouse-setup.test.ts`
- `specs/start-ci-chromium/implementation-artifacts/4-1-introduce-shared-lighthouse-setup-target.md`
