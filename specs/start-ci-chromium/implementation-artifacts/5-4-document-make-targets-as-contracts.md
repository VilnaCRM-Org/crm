# Story 5.4: Document Make Targets as Contracts

Status: review

## Story

As a maintainer,
I want the Make target contract principle documented,
so that future Makefile changes preserve predictable developer workflows.

## Acceptance Criteria

1. CONTRIBUTING states that a Make target must do what its name promises completely and reliably.
2. CONTRIBUTING explains that public Make targets are workflow contracts for contributors and CI.
3. CONTRIBUTING gives maintainers practical rules for evolving Make targets without breaking
   predictable workflows.

## Tasks / Subtasks

- [x] Task 1: Add the Make-target contract guidance to CONTRIBUTING (AC: 1, 2, 3)
  - [x] 1.1 State the contract principle in plain language.
  - [x] 1.2 Tie the principle to contributor and CI workflows.
  - [x] 1.3 Document maintainer rules for changing public Make targets.

## Dev Notes

### Architecture Decisions

- **Contributor-guidance scope:** This story is documentation-only and belongs in `CONTRIBUTING.md`,
  where maintainer workflow expectations already live.
- **Contract framing:** The new guidance treats repository Make targets as public interfaces rather
  than ad-hoc shortcuts, which matches the migration work completed in earlier stories.
- **Actionable rules:** The section lists concrete maintainer behaviors so the principle is usable,
  not just aspirational.

### Project Structure Notes

- **Primary file:** `CONTRIBUTING.md`

### Testing Approach

- Run markdown lint on `CONTRIBUTING.md` to verify the documentation edits remain valid.

## Dev Agent Record

### Agent Model Used

gpt-5-codex

### Debug Log References

- Inspected the contributor guide and found no explicit statement that Make targets act as
  contracts for contributors and CI.
- Added a dedicated section near the maintainer workflow guidance so the principle is documented
  where future workflow changes are most likely to be made.

### Completion Notes List

- Added a new `Make targets as contracts` section to `CONTRIBUTING.md`.
- Documented the contract principle and concrete maintainer rules for future target changes.

### File List

- `CONTRIBUTING.md`
- `specs/start-ci-chromium/implementation-artifacts/5-4-document-make-targets-as-contracts.md`
