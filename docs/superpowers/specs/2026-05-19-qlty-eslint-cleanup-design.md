# Design: qlty + ESLint Code-Health Cleanup

- **Date:** 2026-05-19
- **Branch:** `split/foundation-renames`
- **Scope decision:** All findings in the report. One-shot sweep, single verification pass. Orphaned duplicate copies are deleted.

## Problem

A qlty + ESLint report lists ~25 findings across the auth module, shared
skeleton components, services, store config, and tests. The goal is to clear
the entire report while preserving behavior.

### Severity reframe (important context, not itself a deliverable)

- `.qlty/qlty.toml` sets `[smells] mode = "comment"` — every qlty finding
  (function-complexity, identical-code, similar-code, return-statements,
  boolean-logic) is an advisory PR comment, **not** a CI failure.
- ESLint `react/jsx-no-bind` = `'warn'` (non-blocking).
- ESLint `import/no-extraneous-dependencies` = `'error'` (the only
  CI-blocking rule among the findings) — but `zod` (dependencies),
  `storybook` and `@testing-library/user-event` (devDependencies) are **all
  already declared**. These errors are therefore expected to be false
  positives / stale, to be confirmed by running the real linter in Docker.

The user still wants the full report cleared for code health, so all
categories are addressed; this reframe only governs priority and risk
narrative, not scope.

## Findings → fix strategy

### 1. Style duplication (qlty:identical-code / similar-code)

Root cause: `split/foundation-renames` left a re-export artifact.
`src/modules/user/features/auth/components/auth-skeleton/index.tsx`
re-exports the canonical `@/components/skeletons/auth-skeleton`, so its
sibling `styles.ts` (181 lines) is orphaned dead code and is the source of
the three largest `identical-code` findings (mass 157 / 81 / 75) plus the
`fieldGapMargins` finding (mass 80).

- **Delete** `src/modules/user/features/auth/components/auth-skeleton/styles.ts`.
  Confirm via importer search that nothing besides the (deleted) file's own
  tree references it before removing.
- **Extract a shared module** for the genuine overlap between
  `src/modules/user/features/auth/components/form-section/styles.ts` and
  `src/components/skeletons/auth-skeleton/styles.ts`:
  `fieldGapMargins`, `formSection`, `formWrapper` move into a new
  `src/components/skeletons/base/auth-form-shared-styles.ts` (co-located
  with the existing `base/styles.ts`).
- Both consumers import the shared constants. The skeleton spreads them into
  its default-export object so its **public shape is unchanged** (consumers
  and `auth-skeleton.spacing.test.ts` keep working untouched).
- `src/modules/user/features/auth/components/form-section/components/styles.ts`
  is deduped against the same shared module if it carries the same blocks.

### 2. qlty:function-complexity

- `fetchAndSaveSchema` (33) in `docker/apollo-server/lib/schema-fetcher.ts`:
  extract `resolveSchemaConfig()` (env parsing for URL / retries / timeout)
  and `attemptFetch()` (a single fetch+write attempt); the retry loop stays
  thin. Behavior-preserving — same retries, backoff, error handling.
- `actionSanitizer` (20) in `src/stores/dev-tools-options.ts`: extract
  per-section redaction helpers (e.g. `redactMeta`, `redactPayload`) so the
  top-level function is a thin orchestrator.

### 3. qlty:return-statements

- `handleApiError` (15 returns) in
  `src/modules/user/features/auth/repositories/base-api.ts`: replace the
  if/return chain with an ordered list of `(predicate, factory)` handlers
  resolved to a single exit.
- `normalizeLoginErrorMessage` (8) in `login-form.tsx` and
  `createPasswordValidator` (6) in `.../validations/password.ts`: collapse
  to single-exit via a resolved-value variable / first-match lookup.

### 4. qlty:boolean-logic

- `base-api.ts` network-error keyword OR-chain and `dev-tools-options.ts`
  sensitive-key OR-chain → `KEYWORDS.some((k) => m.includes(k))` with a
  named keyword array.
- `is-api-error.ts` and `services/https-client/fetch-https-client.ts` →
  extract named boolean predicates (`hasErrorCode`, `isPlainBody`, …) so
  no single expression is a long `&&`/`||` chain.

### 5. eslint:react/jsx-no-bind (warn)

Hoist inline arrow/function props to stable references:

- Components: `login-form.tsx` (`handleLogin`), `password-field.tsx`
  (`handleClickShowPassword`, mousedown preventDefault), `user-options/index.tsx`
  (`onChange`), `form-section/index.tsx` (`inert` ref callback),
  `ui-form-input-field/index.tsx` (Controller `render`). Use `useCallback`
  / module-scope handlers; the Controller `render` and ref callback become
  named memoized callbacks.
- Test files: `login-form.test.tsx`, `form-section/index.test.tsx`,
  `auth-error-boundary/index.test.tsx` → extract named handler consts.

### 6. eslint:import/no-extraneous-dependencies (error)

- **Verify-first in Docker** (`make lint-eslint`, optionally targeted) to
  establish ground truth.
- Expected: false positive / stale → **no dependency changes**.
- If a genuine resolver issue surfaces, fix via ESLint
  `import/resolver` / `packageDir` config — **not** by adding
  already-present packages to `package.json`. No dependency additions.

## Verification (all in Docker — non-negotiable)

The project mandates Docker for lint/test; local `bun x eslint` resolves a
stray ESLint v8 and cannot read the v9 flat config.

- `make lint-eslint` + `make lint-tsc` → zero new errors.
- `make test-unit-all` → green (covers `auth-skeleton.spacing/typography/test`,
  `login-form`, `form-section`, `auth-error-boundary`, etc.).
- `make test-visual` → no skeleton / form-section visual regression.
- If a qlty CLI run is available, spot-confirm the smells are cleared.

## Risk

Style extraction/deletion is the only behavior-risk (visual regression),
mitigated by `test-visual` plus the existing spacing/typography unit tests.
Everything else is behavior-preserving refactor guarded by existing unit
tests. One-shot sweep means a single verification pass; if `test-visual`
fails, the style change is the prime suspect.

## Out of scope

- No unrelated refactoring beyond what each finding requires.
- No dependency manifest changes (deps are already declared).
- No qlty config or smell-mode changes.
