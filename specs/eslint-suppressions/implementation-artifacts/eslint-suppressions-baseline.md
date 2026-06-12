# ESLint Suppression Baseline

Status: complete — before-cleanup inventory (Story 2.1) and after-cleanup inventory
(Story 2.5) are recorded, and the standalone enforcement decision is finalized in Story 3.2
(see "Enforcement Decision" below).

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

## Source Cleanup (Story 2.3, 2026-06-10)

Source scope for this story is `src`. The one source entry was removed:

- `src/services/https-client/http-error-response-parser.ts:49` — the
  `// eslint-disable-next-line no-console` was removed by switching the parse-failure
  diagnostic from `console.debug` to `console.warn`. `no-console` already allows `warn`/
  `error`, so the directive is no longer needed and the diagnostic is preserved (same message
  and payload). The parser's public contract (return value and the error thrown by `assertOk`)
  is unchanged. Unit and integration tests were updated to spy on `console.warn`.

Running inventory after Story 2.3: **2** (tooling `eslint.config.mjs:173`, test
`form-section.test.tsx:2`). `tests` and the tooling allow-list remain out of scope here.

## Test Cleanup (Story 2.4, 2026-06-10)

Test scope for this story is `tests`. The one test entry was removed:

- `tests/unit/modules/user/features/auth/components/form-section.test.tsx:2` — the
  `/* eslint-disable testing-library/prefer-screen-queries */` was removed by migrating every
  Testing Library query from the destructured `render()` result
  (`view.getBy*`/`view.queryBy*`/`view.getAllByRole`) to the global `screen.*` API, which is
  exactly what `testing-library/prefer-screen-queries` requires. Test intent is unchanged: all
  10 assertions are equivalent (same roles, text, and mock-stub test IDs) and the suite stays
  10/10 green. The `data-testid` queries that remain target only `jest.mock` stub elements (a
  legitimate exception per the semantic-test-selectors policy), so they raise only the existing
  `*ByTestId` warning, not an error, and introduce no new lint regression.

Running inventory after Story 2.4: **1** (tooling `eslint.config.mjs:173`). The `src` and
`tests` suppressions are now resolved; only the deferred tooling allow-list remains, to be
dropped or accepted as the baseline in Story 2.5.

## After-Cleanup Inventory (Story 2.5, 2026-06-10)

Command rerun against the default scan scope:

```text
$ make lint-eslint-suppressions
No ESLint suppression directives found in: src tests scripts eslint.config.mjs
```

Total in-scope scan matches: **0**. The target exits zero (pass).

The one remaining inventory entry — the deferred tooling allow-list at
`eslint.config.mjs:173` — was dropped in this story. With the source (Story 2.3) and test
(Story 2.4) `eslint-disable` directives already removed, the `eslint-comments/no-use`
`allow` list no longer permitted any real suppression, so the `allow` option was deleted and
the rule was tightened to a bare `'eslint-comments/no-use': 'error'`. `make lint-eslint`
still passes (no new errors; only the pre-existing `*ByTestId` warnings from issue #90
remain), and the scan now reports zero matches.

### Baseline decision

The repository contains **no ESLint suppressions** after cleanup. The accepted baseline is
therefore **zero**: every directive variant (`eslint-disable-next-line`,
`eslint-disable-line`, `eslint-disable`, `eslint-enable`) is absent from the default scan
scope (`src tests scripts eslint.config.mjs`). Because the baseline is zero, any future
suppression is unambiguously new debt — `make lint-eslint-suppressions` will report it and
exit non-zero, and ESLint's own `eslint-comments/no-use` rule (now without an `allow` list)
will flag the comment as an error before it ever reaches the standalone scan.

### Before/after counts

| Stage               | In-scope matches | Notes                                      |
| ------------------- | ---------------- | ------------------------------------------ |
| Before cleanup      | 3                | 1 tooling, 1 source, 1 test (Story 2.1)    |
| After Story 2.3     | 2                | source `no-console` removed                |
| After Story 2.4     | 1                | test `prefer-screen-queries` removed       |
| After cleanup (2.5) | 0                | tooling allow-list dropped; rule tightened |

## Enforcement Decision (Story 3.2, 2026-06-10)

**Decision:** the suppression inventory target is **Standalone during MVP**. It is run
directly and on demand via `make lint-eslint-suppressions`, against the default scan scope
`src tests scripts eslint.config.mjs`.

- **Lint and CI are untouched.** Restated in policy terms:
  aggregate `make lint` and CI enforcement are not changed in MVP. The target is intentionally
  not added to aggregate `make lint`, and the suppression scan is not added as a CI gate. The
  existing lint workflow (`lint-eslint lint-tsc lint-md lint-deps lint-metrics`) and the CI
  lint jobs run exactly as before this feature.
- The Makefile encodes this placement, so it is a tested invariant rather than only prose:
  aggregate `lint:` lists `lint-eslint lint-tsc lint-md lint-deps lint-metrics` and
  intentionally omits `lint-eslint-suppressions`. `tests/bats/eslint_suppressions.bats`
  asserts the `lint:` line does not contain `lint-eslint-suppressions` (Stories 1.1 and 3.1).

### Accepted baseline and remaining-suppression rationale

The accepted baseline is **zero**: after cleanup the default scan reports **0** matches across
`src tests scripts eslint.config.mjs`. Because the baseline is zero there are **no remaining
suppressions** and therefore no per-entry rationale to record — there is no accepted or
intentional suppression carried forward. Any future suppression is unambiguously new debt:
`make lint-eslint-suppressions` will report it and exit non-zero, and ESLint's own
`eslint-comments/no-use` rule (now without an `allow` list) flags the directive as an error
before it reaches the standalone scan.

### Future enforcement options (deferred)

The repository has reached a zero baseline, but no agreed policy yet promotes the scan to a
blocking gate. The following options are explicitly **deferred** beyond the MVP, and
no story requires CI enforcement or aggregate lint wiring as part of the MVP:

- Wiring `lint-eslint-suppressions` into aggregate `make lint` — would add it to the `lint:`
  prerequisites and update the Bats placement test so both the standalone target and aggregate
  `lint` stay validated (the future-wiring guidance recorded in Story 3.1).
- Adding the suppression scan as a CI enforcement gate on pull requests.

These remain future, maintainer-driven decisions. The MVP intentionally delivers only the
standalone command, the zero baseline, and this evidence so reviewers can act on the current
output without relying on future policy assumptions.
