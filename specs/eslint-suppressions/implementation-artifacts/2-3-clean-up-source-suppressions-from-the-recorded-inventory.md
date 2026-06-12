# Story 2.3: Clean Up Source Suppressions From the Recorded Inventory

Status: done

## Story

As a contributor,
I want to remove safe ESLint suppressions from source files identified in the recorded
inventory,
so that application code quality improves without bundling source cleanup with tooling or test
changes.

## Acceptance Criteria

1. Given Story 2.1 recorded the before-cleanup inventory, when the contributor starts source
   cleanup, then only suppression entries under `src` are in scope for this story, and
   suppressions under `scripts`, the ESLint config file, and `tests` are out of scope.
2. Given a source suppression from the recorded inventory is inspected, when the underlying
   lint issue can be fixed safely with code, test, or lint-configuration, then the suppression
   is removed and the related behaviour remains equivalent.
3. Given a source suppression from the recorded inventory is inspected, when removing it would
   require component redesign, state-management migration, or UI behaviour change, then the
   suppression is left in place for the MVP baseline and the rationale is recorded.
4. Given cleanup changes are made in source files, when relevant existing lint checks are run,
   then those lint checks remain usable and do not introduce unrelated lint regressions.
5. Given the recorded before-cleanup inventory contains no source suppressions, when this
   story is executed, then the baseline artifact records zero source suppressions in scope and
   no source cleanup code changes are required.

## Tasks / Subtasks

- [x] Task 1: Identify the in-scope source inventory (AC: 1)
  - [x] 1.1 Confirm the only `src` entry is `http-error-response-parser.ts:49`
        (`// eslint-disable-next-line no-console`)
- [x] Task 2: Remove the source suppression at the root cause (AC: 2, 4)
  - [x] 2.1 (RED) Update unit and integration tests to expect `console.warn`
  - [x] 2.2 (GREEN) Switch the parse-failure diagnostic from `console.debug` to `console.warn`
        and delete the `eslint-disable-next-line` directive
  - [x] 2.3 Confirm `make lint-eslint-suppressions` no longer reports the `src` entry
- [x] Task 3: Verify gates (AC: 4)
  - [x] 3.1 Unit and integration suites pass; `src` coverage stays 100%
  - [x] 3.2 `make lint-eslint` reports no new errors

## Dev Notes

- The suppressed call was `console.debug(...)` in the `parse()` catch block. `no-console` is
  configured as `['error', { allow: ['warn', 'error'] }]`, so `debug` was disallowed and the
  directive silenced it. There is no project logger service, so the allowed channel is
  `console`. Switching to `console.warn` keeps the same diagnostic (message and
  `{ message, stack }` payload) while removing the suppression — a parse failure of an error
  response body is a reasonable warning condition.
- Behaviour equivalence: `parse()` still returns `{ message, body: undefined }` on failure and
  `assertOk()` still throws the same `HttpError`; only the log channel changed from `debug` to
  the allowed `warn`.
- Five test spy sites (`console.debug` -> `console.warn`, `debugSpy` -> `warnSpy`) were updated
  across one unit and two integration suites.
- The `eslint.config.mjs` allow-list (Story 2.2) and the `tests` suppression (Story 2.4) remain
  out of scope and untouched.

## Dev Agent Record

### Agent Model Used

claude-opus-4-8

### Completion Notes List

- `make lint-eslint-suppressions` now reports 2 (down from 3): tooling `eslint.config.mjs:173`
  and test `form-section.test.tsx:2`.
- Parser unit suite 16/16 pass; full integration suite 29 suites / 365 tests pass with `src`
  at 100% coverage. `make lint-eslint` reports 0 errors.

### File List

- `src/services/https-client/http-error-response-parser.ts`
- `tests/unit/services/https-client/http-error-response-parser.test.ts`
- `tests/integration/services/http-error-response-parser.integration.test.ts`
- `tests/integration/services/https-client-response-processing.integration.test.ts`
- `specs/eslint-suppressions/implementation-artifacts/eslint-suppressions-baseline.md`
- `specs/eslint-suppressions/implementation-artifacts/2-3-clean-up-source-suppressions-from-the-recorded-inventory.md`

### Change Log

- 2026-06-10: Story 2.3 — removed the `src` `no-console` suppression in
  `http-error-response-parser.ts` by switching the parse-failure diagnostic from
  `console.debug` to the allowed `console.warn`; updated the spying tests and recorded the
  source cleanup in the baseline (running inventory now 2).
