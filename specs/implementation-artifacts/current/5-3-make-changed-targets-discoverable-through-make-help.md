# Story 5.3: Make Changed Targets Discoverable Through make help

Status: review

## Story

As a developer,
I want changed public Makefile targets to appear in `make help`,
so that I can discover available workflow commands from the terminal.

## Acceptance Criteria

1. `make help` describes `start` in terms of the updated frontend + Mockoon startup behavior.
2. `make help` describes `ci` in terms of the canonical local/remote CI workflow.
3. `make help` includes `lighthouse-setup` with a user-facing shared-setup description.

## Tasks / Subtasks

- [x] Task 1: Lock the help-output contract with focused tooling coverage (AC: 1, 2, 3)
  - [x] 1.1 Add a test that runs `make help`.
  - [x] 1.2 Assert `start` shows the updated startup description.
  - [x] 1.3 Assert `ci` shows the updated CI description.
  - [x] 1.4 Assert `lighthouse-setup` appears with its shared-setup description.

- [x] Task 2: Update the public Makefile help text (AC: 1, 2, 3)
  - [x] 2.1 Update the `start` help text to reflect frontend + Mockoon startup.
  - [x] 2.2 Update the `ci` help text to reflect the shared local/GitHub Actions flow.
  - [x] 2.3 Update the `lighthouse-setup` help text to describe the shared prerequisites clearly.

## Dev Notes

### Architecture Decisions

- **Help-text only:** This story changes command descriptions, not command behavior.
- **User-facing phrasing:** The updated `##` comments prioritize discoverability over internal
  implementation detail so `make help` stays useful as an entrypoint for contributors.
- **Scope boundary:** Only the changed public workflow targets were updated in this story.

### Project Structure Notes

- **Primary file:** `Makefile`
- **Focused test file:** `tests/unit/tooling/make-help.test.ts`
- **Supporting tracking artifact:** `specs/implementation-artifacts/current/sprint-status.yaml`

### Testing Approach

- Run the focused `make help` tooling test that asserts the relevant descriptions appear.
- Run `make help` directly to inspect the rendered terminal output for the changed targets.

## Dev Agent Record

### Agent Model Used

gpt-5-codex

### Debug Log References

- Inspected the current `make help` output and confirmed the changed public targets still used older
  generic descriptions such as "Start the application".
- Added the help-output test before editing the Makefile and confirmed it failed against the stale
  target descriptions.
- Updated the `##` comments and re-ran the test until the rendered help output matched the new
  startup and workflow wording.

### Completion Notes List

- Updated `make help` output for `start`, `ci`, and `lighthouse-setup`.
- Added a focused test to keep the terminal-facing discoverability contract stable.

### File List

- `Makefile`
- `tests/unit/tooling/make-help.test.ts`
- `specs/implementation-artifacts/current/5-3-make-changed-targets-discoverable-through-make-help.md`
- `specs/implementation-artifacts/current/sprint-status.yaml`
