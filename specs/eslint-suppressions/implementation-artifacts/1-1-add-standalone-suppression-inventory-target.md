# Story 1.1: Add Standalone Suppression Inventory Target

Status: done

## Story

As a contributor,
I want to run `make lint-eslint-suppressions`,
so that I can inventory ESLint suppression directives without constructing my own
search command.

## Acceptance Criteria

1. Given the repository Makefile contains the existing lint targets, when a contributor
   inspects the lint target section, then `lint-eslint-suppressions` exists near the related
   lint targets, and the target is not wired into aggregate `make lint` during MVP.
2. Given the suppression inventory target exists, when it runs with default settings, then it
   scans `src`, `tests`, `scripts`, and `.eslintrc.js`, and it excludes `.git`,
   `node_modules`, `dist`, `coverage`, `test-results`, `playwright-report`,
   `storybook-static`, `out`, `specs`, and `docs`.
3. Given the Makefile implementation is reviewed, when the suppression policy is inspected,
   then it defines `ESLINT_SUPPRESSION_PATTERN` and `ESLINT_SUPPRESSION_SCAN_PATHS`, and
   `ESLINT_SUPPRESSION_SCAN_PATHS` can be overridden from the Make invocation.

## Tasks / Subtasks

- [x] Task 1: Define the suppression policy variables in `Makefile` (AC: 3)
  - [x] 1.1 Add `ESLINT_SUPPRESSION_PATTERN` with the locked duplicate-free directive
        expression
  - [x] 1.2 Add `ESLINT_SUPPRESSION_SCAN_PATHS = src tests scripts .eslintrc.js`
  - [x] 1.3 Add `ESLINT_SUPPRESSION_GREP_ARGS` with recursive, line-numbered, extended-regex
        flags and backup directory exclusions
- [x] Task 2: Implement the standalone target (AC: 1, 2)
  - [x] 2.1 Add `lint-eslint-suppressions` near the existing lint targets with a
        `## help` comment
  - [x] 2.2 Filter scan paths through an existence check so absent paths (e.g. `.eslintrc.js`
        in this flat-config repository) do not turn into grep scan errors
  - [x] 2.3 Keep aggregate `lint:` unchanged (standalone MVP placement)
- [x] Task 3: Bats coverage (AC: 1, 2, 3)
  - [x] 3.1 Add `tests/bats/eslint_suppressions.bats` with policy-placement, default-scope,
        exclusion, and scan-path-override tests using runtime-built directive strings
  - [x] 3.2 Register the target in `tests/bats/make-target-coverage.tsv`

## Dev Notes

- The directive pattern orders the longer `eslint-disable-*` forms before `eslint-disable`
  so each occurrence is reported exactly once (architecture: Directive Matching).
- Exit-code contract: grep `0` (matches) fails the target with a cleanup message, grep `1`
  (no matches) passes with a success message, and any other grep status propagates as a
  scan error (architecture: Error Handling Patterns).
- `.eslintrc.js` stays in the locked scan-path value even though this repository uses ESLint
  v9 flat config (`eslint.config.mjs`); the existence filter keeps the scan healthy while the
  tooling-scope decision is revisited in the Epic 2 cleanup stories.
- Bats fixtures build directive tokens at runtime (`suppression_directive`) because
  `tests/` is inside the target's own default scan scope.

## Dev Agent Record

### Agent Model Used

claude-fable-5 (initial implementation), claude-opus-4-8 at xhigh effort (verification)

### Completion Notes List

- `make lint-eslint-suppressions` against the real repository reports the two current
  suppressions (`src/services/https-client/http-error-response-parser.ts:49`,
  `tests/unit/modules/user/features/auth/components/form-section.test.tsx:2`) and exits
  non-zero, matching the before-cleanup expectation for Story 2.1.
- `tests/bats/eslint_suppressions.bats`: 5/5 pass; full Bats suite 21/21 pass, including the
  coverage-completeness contract that requires every Makefile target to be registered.

### File List

- `Makefile`
- `tests/bats/eslint_suppressions.bats`
- `tests/bats/make-target-coverage.tsv`
- `specs/eslint-suppressions/implementation-artifacts/1-1-add-standalone-suppression-inventory-target.md`

### Change Log

- 2026-06-10: Story 1.1 implemented — suppression policy variables, standalone
  `lint-eslint-suppressions` target, Bats coverage, and coverage-manifest registration.
