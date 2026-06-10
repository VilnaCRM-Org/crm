# ESLint Suppression Baseline

Status: in progress — before-cleanup inventory captured in Story 2.1; after-cleanup and
enforcement decision are recorded in Stories 2.5 and 3.2.

## Command and Scan Scope

- Command: `make lint-eslint-suppressions`
- Default scan paths (`ESLINT_SUPPRESSION_SCAN_PATHS`): `src tests scripts eslint.config.mjs`
- Directive pattern (`ESLINT_SUPPRESSION_PATTERN`): the four variants
  `eslint-disable-next-line`, `eslint-disable-line`, `eslint-disable`, and `eslint-enable`
- Excluded directories: `.git`, `node_modules`, `dist`, `coverage`, `test-results`,
  `playwright-report`, `storybook-static`, `out`, `specs`, `docs`
- This repository uses ESLint v9 flat config. The planning artifacts say `.eslintrc.js`, but
  that file does not exist; Story 2.1 corrected the scan scope to the real config file
  `eslint.config.mjs` so the tooling configuration is actually inventoried.

## Before-Cleanup Inventory (Story 2.1, 2026-06-10)

Total in-scope scan matches: **3** (1 tooling, 1 source, 1 test).

### Tooling (`scripts`, `eslint.config.mjs`)

- `eslint.config.mjs:173` — the `eslint-comments/no-use` rule's
  `allow: ['eslint-disable-next-line', 'eslint-disable', 'eslint-enable']` option. This is a
  configuration allow-list rather than an active disable comment; the matching string literals
  are reported by the scan. Cleanup is the PRD's lint-configuration fix (Story 2.2): tighten or
  drop the `allow` list once the source and test suppressions are removed.
- No suppressions found under `scripts`.

### Source (`src`)

- `src/services/https-client/http-error-response-parser.ts:49` —
  `// eslint-disable-next-line no-console`. Deferred to Story 2.3 (source cleanup).

### Test (`tests`)

- `tests/unit/modules/user/features/auth/components/form-section.test.tsx:2` —
  `/* eslint-disable testing-library/prefer-screen-queries */`. Deferred to Story 2.4 (test
  cleanup).

## Tooling Cleanup Decision (Story 2.2, 2026-06-10)

Tooling scope for this story is `scripts` and `eslint.config.mjs`. In-scope inventory:

- `scripts`: zero suppressions — no cleanup required.
- `eslint.config.mjs:173`: the `eslint-comments/no-use` `allow` list. **Left in place for the
  MVP baseline** (deferred).

Rationale for deferral: this `allow` list is exactly what permits the two real
`eslint-disable` directives still present in `src` and `tests`. The
`eslint-comments/no-use` rule is configured as `error`, so dropping the `allow` list now
would make ESLint flag both
`src/services/https-client/http-error-response-parser.ts:49` and
`tests/unit/modules/user/features/auth/components/form-section.test.tsx:2`. That is an
unrelated lint regression and would break `make lint-eslint` (and the pre-commit hook).
Removing the allow-list therefore depends on the source (Story 2.3) and test (Story 2.4)
cleanups landing first. It will be dropped in or after Story 2.4 and re-inventoried in
Story 2.5.

No tooling code changes were made in Story 2.2; `src` and `tests` entries remain out of scope.

## After-Cleanup Inventory

To be recorded in Story 2.5 (rerun `make lint-eslint-suppressions` and capture the
after-cleanup count and any remaining baseline).

## Enforcement Decision

To be recorded in Story 3.2. The MVP target stays standalone: it is intentionally not wired
into aggregate `make lint` or CI enforcement, pending an explicit baseline decision.
