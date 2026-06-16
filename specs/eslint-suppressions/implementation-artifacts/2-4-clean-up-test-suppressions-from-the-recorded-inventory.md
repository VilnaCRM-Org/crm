# Story 2.4: Clean Up Test Suppressions From the Recorded Inventory

Status: done

## Story

As a contributor,
I want to remove safe ESLint suppressions from test files identified in the recorded inventory,
so that test quality improves without mixing test cleanup with source or tooling changes.

## Acceptance Criteria

1. Given Story 2.1 recorded the before-cleanup inventory, when the contributor starts test
   cleanup, then only suppression entries under `tests` are in scope for this story, and
   suppressions under `scripts`, the ESLint config file, and `src` are out of scope.
2. Given a test suppression comment from the recorded inventory is inspected, when the
   underlying lint issue can be fixed safely with test code or lint-configuration changes, then
   the suppression comment is removed and the related test intent remains equivalent.
3. Given a test suppression comment from the recorded inventory is inspected, when removing it
   would require unrelated test redesign or risky behavioral changes, then the suppression is
   left in place for the MVP baseline and the rationale is recorded.
4. Given cleanup changes are made in test files, when relevant existing lint checks are run,
   then those lint checks remain usable and do not introduce unrelated lint regressions.
5. Given the recorded before-cleanup inventory contains no test suppressions, when this story
   is executed, then the baseline artifact records zero test suppressions in scope and no test
   cleanup code changes are required.

## Tasks / Subtasks

- [x] Task 1: Identify the in-scope test inventory (AC: 1)
  - [x] 1.1 Confirm the only `tests` entry is `form-section.test.tsx:2`
        (`/* eslint-disable testing-library/prefer-screen-queries */`)
- [x] Task 2: Remove the test suppression at the root cause (AC: 2, 4)
  - [x] 2.1 (RED) Confirm `make lint-eslint-suppressions` reports the directive and the rule
        would fire without it
  - [x] 2.2 (GREEN) Migrate every destructured `render()` query to the global `screen.*` API
        and delete the `eslint-disable` directive
  - [x] 2.3 Refactor `getAuthProviderContainer` to be parameterless and use `screen.*`
- [x] Task 3: Verify gates (AC: 2, 4)
  - [x] 3.1 The `form-section` suite stays 10/10 green with equivalent assertions
  - [x] 3.2 `make lint-eslint` reports no new errors
  - [x] 3.3 `make lint-eslint-suppressions` no longer reports the `tests` entry

## Dev Notes

- `testing-library/prefer-screen-queries` fires when queries are taken from the value returned
  by `render()` (here aliased as `view.getBy*`) instead of the global `screen` object. The
  root-cause fix is to query through `screen`, which is exactly the rule's intent — no test
  redesign or behavioural change is needed, so AC3's deferral path does not apply.
- Migration details:
  - Added `screen` to the `@testing-library/react` import.
  - Replaced every `view.getByTestId`/`getByText`/`getByRole`/`queryByTestId`/`queryByRole`
    call with `screen.*`.
  - Dropped each now-unused `const view = render(...)` binding to a bare `render(...)`, except
    the rerender test where `const { rerender } = render(...)` is kept (`rerender` is not on
    `screen`).
  - Changed `getAuthProviderContainer(view)` to a parameterless helper using
    `screen.getAllByRole('generic')`.
- Test intent is equivalent: the same 10 cases assert the same roles (`alert`, `generic`),
  text, and mock-stub test IDs. The `inert` toggle and `role="alert"` coverage are unchanged.
- The remaining `data-testid` queries target only `jest.mock` stub elements (login-form,
  registration-form, auth-provider-buttons, trigger-success-view). These are a legitimate
  exception under the semantic-test-selectors policy, so they raise only the pre-existing
  `*ByTestId` warning (issue #90), not an error — no new lint regression.
- Scope discipline: `eslint.config.mjs` (tooling allow-list, Story 2.2) and `src` (Story 2.3)
  were not touched. Dropping the now-unblocked allow-list is sequenced into Story 2.5.
- A11y: the `.tsx` test edit was reviewed by the `accessibility-lead` agent (no markup or
  accessibility semantics changed) before the edit was applied, per repo policy.

## Dev Agent Record

### Agent Model Used

claude-opus-4-8

### Completion Notes List

- `make lint-eslint-suppressions` now reports 1 (down from 2): only the tooling
  `eslint.config.mjs:173` allow-list remains.
- `form-section` suite 10/10 pass. `make lint-eslint` reports 0 errors (only the allowed
  mock-stub `*ByTestId` warnings remain).

### File List

- `tests/unit/modules/user/features/auth/components/form-section.test.tsx`
- `specs/eslint-suppressions/implementation-artifacts/eslint-suppressions-baseline.md`
- `specs/eslint-suppressions/implementation-artifacts/2-4-clean-up-test-suppressions-from-the-recorded-inventory.md`

### Change Log

- 2026-06-10: Story 2.4 — removed the `tests` `prefer-screen-queries` suppression in
  `form-section.test.tsx` by migrating all destructured `render()` queries to the global
  `screen.*` API; recorded the test cleanup in the baseline (running inventory now 1).
