# Story 2.1: Capture Current Suppression Inventory

Status: done

## Story

As a contributor,
I want to run the suppression inventory before cleanup,
so that I know the exact current suppression set I am working from.

## Acceptance Criteria

1. Given `lint-eslint-suppressions` exists, when a contributor runs
   `make lint-eslint-suppressions` against the default scan scope before cleanup, then the
   command reports the current in-scope ESLint suppression directives, and the contributor
   records the before-cleanup suppression count in the baseline artifact.
2. Given the command reports suppression locations, when the contributor reviews the output,
   then known affected files from `scripts`, `src`, and `tests` are identified for cleanup,
   and the ESLint config file is treated as scan scope (not assumed to contain a current
   suppression), and the inventory is grouped by tooling, source, and test area in the
   baseline artifact.

## Tasks / Subtasks

- [x] Task 1: Reconcile the scan scope with project reality (AC: 2)
  - [x] 1.1 Change `ESLINT_SUPPRESSION_SCAN_PATHS` from the non-existent `.eslintrc.js` to the
        real flat-config file `eslint.config.mjs`
  - [x] 1.2 Update the Bats policy-placement and default-scope tests to expect
        `eslint.config.mjs`
  - [x] 1.3 Reword a Bats comment that contained raw directive tokens so `tests/` no longer
        self-reports a false-positive suppression
- [x] Task 2: Capture the before-cleanup inventory (AC: 1, 2)
  - [x] 2.1 Run `make lint-eslint-suppressions` against the default scope
  - [x] 2.2 Record the before-cleanup count and grouped locations in
        `eslint-suppressions-baseline.md`

## Dev Notes

- Scope correction: the planning artifacts say `.eslintrc.js`, but this repository uses ESLint
  v9 flat config. `.eslintrc.js` does not exist, so the previous default scan silently missed
  the tooling allow-list in `eslint.config.mjs:173` and reported only 2 of 3 matches. Story 1.1
  deliberately deferred this to Epic 2; Story 2.1 is that reconciliation point.
- The Bats suite keeps `tests/` free of raw directive tokens by building them at runtime via
  `suppression_directive`. A comment added during Story 1.2 reintroduced a raw token and was
  itself reported by the scan; it is now reworded to a prefix-form description.
- Before-cleanup total is 3 (1 tooling, 1 source, 1 test). The tooling entry is the
  `eslint-comments/no-use` `allow` list, not an active disable comment; its cleanup is the
  PRD's lint-configuration fix (Story 2.2).
- The target remains standalone (not wired into aggregate `make lint` or CI), unchanged by
  this story.

## Dev Agent Record

### Agent Model Used

claude-opus-4-8

### Completion Notes List

- `make lint-eslint-suppressions` now scans `src tests scripts eslint.config.mjs` and reports
  the 3 before-cleanup matches, exiting non-zero as expected.
- `tests/bats/eslint_suppressions.bats`: 8/8 pass; full Bats suite 24/24 pass, including the
  coverage-completeness contract.

### File List

- `Makefile`
- `tests/bats/eslint_suppressions.bats`
- `specs/eslint-suppressions/implementation-artifacts/eslint-suppressions-baseline.md`
- `specs/eslint-suppressions/implementation-artifacts/2-1-capture-current-suppression-inventory.md`
- `specs/eslint-suppressions/implementation-artifacts/1-1-add-standalone-suppression-inventory-target.md`

### Change Log

- 2026-06-10: Story 2.1 — corrected the scan scope to `eslint.config.mjs`, captured the
  before-cleanup inventory (3 directives) in the baseline artifact, and reworded a Bats
  comment that self-reported a false positive.
