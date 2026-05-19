# qlty + ESLint Code-Health Cleanup Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Clear every qlty + ESLint finding in the report via behavior-preserving refactors, deleting orphaned duplicate code, with a single full Docker verification pass at the end.

**Architecture:** Mechanical refactors grouped by concern. Style duplication is removed by deleting an orphaned file and extracting a shared styles module. Complexity / return-count / boolean-logic smells are resolved by extracting named helpers and replacing long boolean chains with keyword-array `.some()` lookups. `react/jsx-no-bind` is resolved by hoisting inline functions to `useCallback`/named consts. The `import/no-extraneous-dependencies` "errors" are false positives (all three packages are already declared) and are verify-only — no manifest changes.

**Tech Stack:** TypeScript, React 18, MUI/Emotion, react-hook-form, Redux Toolkit, Jest (jsdom + node), Playwright. All lint/test runs go through Docker (`make ...`); local `bun x eslint` resolves a stray ESLint v8 and cannot read the v9 flat config.

**Spec:** `docs/superpowers/specs/2026-05-19-qlty-eslint-cleanup-design.md`

**Pre-flight (run once, before Task 1):**
```bash
make start          # bring up the dev container (idempotent if already up)
docker compose exec -T dev bun x jest --listTests >/dev/null   # sanity: jest resolves
```
Baseline must be green before refactoring. If `make start` is already running, skip it.

---

### Task 1: Remove style duplication (delete orphan + extract shared module)

**Files:**
- Verify-then-Delete: `src/modules/user/features/auth/components/auth-skeleton/styles.ts`
- Create: `src/components/skeletons/base/auth-form-shared-styles.ts`
- Modify: `src/components/skeletons/auth-skeleton/styles.ts`
- Modify: `src/modules/user/features/auth/components/form-section/styles.ts`
- Test (existing regression net): `tests/unit/components/skeletons/auth-skeleton.spacing.test.ts`, `tests/unit/components/skeletons/auth-skeleton.typography.test.tsx`, `tests/unit/components/skeletons/auth-skeleton.test.tsx`

- [ ] **Step 1: Confirm the module-level skeleton styles file is orphaned**

Run:
```bash
grep -rn "features/auth/components/auth-skeleton/styles" src tests --include=*.ts --include=*.tsx | grep -v "auth-skeleton/styles.ts:"
```
Expected: **no output** (nothing imports it; its sibling `index.tsx` re-exports `@/components/skeletons/auth-skeleton`). If there IS output, STOP and report — the delete assumption is wrong.

- [ ] **Step 2: Create the shared styles module**

Create `src/components/skeletons/base/auth-form-shared-styles.ts`:
```ts
import breakpointsTheme from '@/components/ui-breakpoints';
import { paletteColors } from '@/styles/colors';

export const fieldGapMargins = {
  marginBottom: '0.5rem',
  [`@media (min-width:${breakpointsTheme.breakpoints.values.sm}px)`]: {
    marginBottom: '1.125rem',
  },
  [`@media (min-width:${breakpointsTheme.breakpoints.values.md}px)`]: {
    marginBottom: '1.4375rem',
  },
  [`@media (min-width:${breakpointsTheme.breakpoints.values.lg}px)`]: {
    marginBottom: '1.125rem',
  },
  [`@media (min-width:${breakpointsTheme.breakpoints.values.xl}px)`]: {
    marginBottom: '1rem',
  },
};

export const formSection = {
  paddingTop: '0.5rem',
  paddingX: '0.375rem',
  paddingBottom: '1.5rem',
  fontFamily: 'Golos',
  backgroundColor: '#FBFBFB',
  [`@media (min-width:${breakpointsTheme.breakpoints.values.md}px)`]: {
    paddingTop: '8.4375rem',
    paddingBottom: '8.4375rem',
  },
  [`@media (min-width:${breakpointsTheme.breakpoints.values.xl}px)`]: {
    paddingTop: '3.4375rem',
    paddingBottom: '3.4375rem',
  },
};

export const formWrapper = {
  position: 'relative',
  width: '100%',
  padding: '1.5rem 1.5rem 1.375rem',
  margin: '0 auto',
  backgroundColor: paletteColors.background.default,
  border: `1px solid ${paletteColors.border.default}`,
  borderRadius: '16px',
  boxShadow: `0px 7px 40px 0px ${paletteColors.shadow.subtle}`,
  maxWidth: '22.6875rem',
  [`@media (min-width:${breakpointsTheme.breakpoints.values.md}px)`]: {
    maxWidth: '39.5rem',
    paddingTop: '2.625rem',
    paddingLeft: '2.8125rem',
    paddingRight: '2.8125rem',
    paddingBottom: '2.1875rem',
  },
  [`@media (min-width:${breakpointsTheme.breakpoints.values.xl}px)`]: {
    maxWidth: '31.375rem',
    padding: '2.1rem 2.4375rem 1.9375rem',
  },
};
```

- [ ] **Step 3: Delete the orphaned module-level skeleton styles file**

Run:
```bash
git rm src/modules/user/features/auth/components/auth-skeleton/styles.ts
```

- [ ] **Step 4: Rewire `form-section/styles.ts` to consume the shared module**

Replace the full contents of `src/modules/user/features/auth/components/form-section/styles.ts` with:
```ts
import breakpointsTheme from '@/components/ui-breakpoints';
import {
  fieldGapMargins as sharedFieldGapMargins,
  formSection as sharedFormSection,
  formWrapper as sharedFormWrapper,
} from '@/components/skeletons/base/auth-form-shared-styles';
import { customColors, paletteColors } from '@/styles/colors';

// Re-exported for existing consumers (form-section/components/styles.ts).
export const fieldGapMargins = sharedFieldGapMargins;

export default {
  formSection: sharedFormSection,
  formWrapper: sharedFormWrapper,
  formSwitcherButton: {
    display: 'block',
    padding: 0,
    margin: '1.4375rem auto 0',

    fontFamily: 'Golos',
    fontWeight: 500,
    fontSize: '0.9375rem',
    fontStyle: 'normal',
    lineHeight: 1.2,
    letterSpacing: 0,
    color: customColors.text.secondary,
    textTransform: 'none',

    [`@media (min-width:${breakpointsTheme.breakpoints.values.lg}px)`]: {
      margin: '2.75rem auto 0',

      fontSize: '1.125rem',
    },
    [`@media (min-width:${breakpointsTheme.breakpoints.values.xl}px)`]: {
      margin: '1.5rem auto 0',

      fontWeight: 500,
      fontSize: '0.9375rem',
      lineHeight: 1.2,
    },
  },
  formSwitcherError: {
    marginTop: '1rem',
    minHeight: '1.25rem',

    fontFamily: 'Golos',
    fontSize: '0.875rem',
    fontWeight: 500,
    lineHeight: 1.43,
    color: paletteColors.error.main,
    textAlign: 'center',

    [`@media (min-width:${breakpointsTheme.breakpoints.values.lg}px)`]: {
      marginTop: '1.25rem',
    },
  },
};
```
> `paletteColors` is still used (`formSwitcherError.color`); `customColors` still used (`formSwitcherButton.color`). Both imports stay.

- [ ] **Step 5: Rewire the canonical skeleton styles to consume the shared module**

In `src/components/skeletons/auth-skeleton/styles.ts`:

(a) Replace the import block + local `fieldGapMargins` const (lines 1–26) with:
```ts
import {
  fieldGapMargins,
  formSection,
  formWrapper,
} from '@/components/skeletons/base/auth-form-shared-styles';
import {
  SKELETON_BORDER_COLOR,
  SMALL_MOBILE_BREAKPOINT,
  SMALL_MOBILE_BREAKPOINT_UPPER,
  shadowPulseAnimation,
} from '@/components/skeletons/base/styles';
import breakpointsTheme from '@/components/ui-breakpoints';

const AUTH_SKELETON_TINY_BREAKPOINT = '336px';
```
> `paletteColors` import is removed here (its only uses were the inlined `formWrapper`, now imported). `breakpointsTheme` stays (used by `titleSkeleton` etc.).

(b) In the default export object, replace the inlined `formSection: { ... }` block (the object literal spanning `paddingTop: '0.5rem'` … its closing `}`) with:
```ts
  formSection,
```
and replace the inlined `formWrapper: { ... }` block with:
```ts
  formWrapper,
```
Leave every other key (`formWrapperPulse`, `titleSkeleton`, `subtitleWrapper`, `subtitleFirstLine`, `subtitleSecondLine`, `fieldContainer` (still `{ ...fieldGapMargins }`), `fieldLabel`, `lastFieldContainer`, `buttonSkeleton`, `dividerText`, `divider`, `socialContainer`, `socialButton`, `switcherSkeleton`) byte-for-byte unchanged.

- [ ] **Step 6: Type-check and run the skeleton/form regression tests in Docker**

Run:
```bash
docker compose exec -T dev bun x tsc -p tsconfig.json --noEmit
docker compose exec -T dev bun x jest tests/unit/components/skeletons/auth-skeleton.spacing.test.ts tests/unit/components/skeletons/auth-skeleton.typography.test.tsx tests/unit/components/skeletons/auth-skeleton.test.tsx tests/unit/modules/user/features/auth/index.test.tsx -v
```
Expected: tsc clean; all listed suites PASS (public style shapes are unchanged, so spacing/typography assertions still hold).

- [ ] **Step 7: Commit**

```bash
git add -A src/components/skeletons/base/auth-form-shared-styles.ts src/components/skeletons/auth-skeleton/styles.ts src/modules/user/features/auth/components/form-section/styles.ts
git commit -m "refactor(styles): extract shared auth-form styles, drop orphaned skeleton styles

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

### Task 2: Reduce `fetchAndSaveSchema` complexity

**Files:**
- Modify: `docker/apollo-server/lib/schema-fetcher.ts`
- Test (existing regression net): `tests/apollo-server/schema-fetcher.test.ts`

- [ ] **Step 1: Baseline the existing schema-fetcher suite (node env)**

Run:
```bash
docker compose exec -T dev env TEST_ENV=server bun x jest tests/apollo-server/schema-fetcher.test.ts -v
```
Expected: PASS (this is the regression net for the refactor).

- [ ] **Step 2: Extract config resolution + single-attempt helpers**

In `docker/apollo-server/lib/schema-fetcher.ts`, add these two functions immediately **above** `export async function fetchAndSaveSchema`:
```ts
interface SchemaFetchConfig {
  SCHEMA_URL: string;
  MAX_RETRIES: number;
  TIMEOUT_MS: number;
  OUTPUT_FILE: string;
}

function resolveSchemaConfig(outputDir: string): SchemaFetchConfig {
  const SCHEMA_URL: string = process.env.GRAPHQL_SCHEMA_URL || '';
  const parsedRetries = Number(process.env.GRAPHQL_MAX_RETRIES);
  const MAX_RETRIES: number = Number.isFinite(parsedRetries)
    ? Math.max(1, Math.floor(parsedRetries))
    : 3;
  const parsedTimeout = Number(process.env.GRAPHQL_TIMEOUT_MS);
  const TIMEOUT_MS: number = Number.isFinite(parsedTimeout)
    ? Math.max(1, Math.floor(parsedTimeout))
    : 5000;
  const OUTPUT_FILE: string = path.join(outputDir, 'schema.graphql');
  return { SCHEMA_URL, MAX_RETRIES, TIMEOUT_MS, OUTPUT_FILE };
}

async function attemptSchemaFetch(
  config: SchemaFetchConfig,
  outputDir: string
): Promise<void> {
  const controller: AbortController = new AbortController();
  const timeoutId: NodeJS.Timeout = setTimeout(() => controller.abort(), config.TIMEOUT_MS);

  const response: Response = await fetch(config.SCHEMA_URL, {
    signal: controller.signal,
    headers: {
      'User-Agent': 'GraphQL/SchemaFetcher',
      Accept: 'text/plain, application/graphql, application/json;q=0.9, */*;q=0.8',
    },
  }).finally(() => clearTimeout(timeoutId));

  if (!response.ok) {
    throw new Error(`Failed to fetch schema: ${response.status} ${response.statusText}`);
  }

  try {
    await fsPromises.mkdir(outputDir, { recursive: true });
  } catch (err) {
    const normalizedErr: Error = err instanceof Error ? err : new Error(String(err));
    const fsError = normalizedErr as NodeJS.ErrnoException;
    if (fsError.code !== 'EEXIST') {
      throw normalizedErr;
    }
  }

  const data: string = await response.text();
  await fsPromises.writeFile(config.OUTPUT_FILE, data, 'utf-8');
}
```

- [ ] **Step 3: Replace the body of `fetchAndSaveSchema` to orchestrate the helpers**

Replace the entire body of `export async function fetchAndSaveSchema(outputDir: string): Promise<void> { ... }` with:
```ts
export async function fetchAndSaveSchema(outputDir: string): Promise<void> {
  const config = resolveSchemaConfig(outputDir);
  const schemaLogger: Logger = getLogger(outputDir);

  if (!config.SCHEMA_URL) {
    schemaLogger.error('GRAPHQL_SCHEMA_URL is not set. Skipping schema fetch.');
    if (process.env.NODE_ENV === 'production') {
      throw new Error('GRAPHQL_SCHEMA_URL is required in production environment');
    }
    return;
  }

  let retries: number = 0;
  let lastError: Error | null = null;

  while (retries < config.MAX_RETRIES) {
    if (retries > 0) {
      const backoffTime: number = Math.min(1000 * 2 ** retries, 10000);
      schemaLogger.info(`Retry attempt ${retries}/${config.MAX_RETRIES} after ${backoffTime}ms`);
      await new Promise<void>((resolve) => {
        setTimeout(resolve, backoffTime);
      });
    }

    schemaLogger.info(
      `Fetching GraphQL schema from: ${config.SCHEMA_URL}... (Attempt ${retries + 1}/${config.MAX_RETRIES})`
    );

    try {
      await attemptSchemaFetch(config, outputDir);
      schemaLogger.info(`Schema successfully saved to: ${config.OUTPUT_FILE}`);
      return;
    } catch (error) {
      const normalizedError: Error = error instanceof Error ? error : new Error(String(error));
      lastError = normalizedError;
      retries += 1;

      if (normalizedError.name === 'AbortError') {
        schemaLogger.error('Schema fetch timeout after configured time');
      } else {
        schemaLogger.error(`Schema fetch failed: ${normalizedError.message}`);
      }

      if (retries >= config.MAX_RETRIES) {
        break;
      }
    }
  }

  handleFinalError(lastError, schemaLogger, outputDir);
}
```
> `handleFinalError`, `handleFatalError`, `getLogger`, imports (`fsPromises`, `path`, `Logger`) are unchanged.

- [ ] **Step 4: Re-run the schema-fetcher suite (must still pass — behavior unchanged)**

Run:
```bash
docker compose exec -T dev env TEST_ENV=server bun x jest tests/apollo-server/schema-fetcher.test.ts -v
docker compose exec -T dev bun x tsc -p tsconfig.json --noEmit
```
Expected: all PASS; tsc clean. If any test fails, the refactor changed behavior — revert and reconcile against the failing assertion before continuing.

- [ ] **Step 5: Commit**

```bash
git add docker/apollo-server/lib/schema-fetcher.ts
git commit -m "refactor(schema-fetcher): extract config + attempt helpers to cut complexity

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

### Task 3: Simplify `dev-tools-options` (complexity + boolean-logic)

**Files:**
- Modify: `src/stores/dev-tools-options.ts`
- Test (existing regression net): any `tests/unit/**/dev-tools-options*` (run discovery in Step 1)

- [ ] **Step 1: Find and baseline existing coverage**

Run:
```bash
docker compose exec -T dev bun x jest --listTests 2>/dev/null | grep -i "dev-tools" || echo "NO direct test"
docker compose exec -T dev bun x jest dev-tools -v 2>/dev/null || echo "no matching suite"
```
Expected: note whether a direct suite exists. Behavior is preserved either way; this records the regression net.

- [ ] **Step 2: Replace the `isSensitiveKey` boolean chain with a keyword-array lookup**

In `src/stores/dev-tools-options.ts`, replace the `isSensitiveKey` function (the `const isSensitiveKey = (k: string): boolean => { ... };` block) with:
```ts
const SENSITIVE_KEY_SUBSTRINGS = ['token', 'secret', 'pass', 'auth'] as const;
const SENSITIVE_KEY_PATTERN = /(^|[-_])(api|x-?api|access|private|client)?key$/;

const isSensitiveKey = (k: string): boolean => {
  const lower = k.toLowerCase();
  if (SENSITIVE_KEYS_LOWER.has(lower)) return true;
  if (SENSITIVE_KEY_SUBSTRINGS.some((s) => lower.includes(s))) return true;
  return SENSITIVE_KEY_PATTERN.test(lower);
};
```
> Semantically identical: the original `||` chain matched any of the four substrings, the regex, or `includes('auth')`; `'auth'` is in the substring list so coverage is unchanged.

- [ ] **Step 3: Extract a meta-redaction helper to cut `actionSanitizer` complexity**

Add this function immediately **above** `const devToolsOptions: DevToolsEnhancerOptions = {`:
```ts
const REDACTABLE_META_KEYS = ['arg', 'headers', 'request'] as const;

function redactActionMeta(
  meta: Record<string, unknown> | undefined
): { meta: Record<string, unknown> | undefined; changed: boolean } {
  if (!meta || typeof meta !== 'object') {
    return { meta, changed: false };
  }
  const next: Record<string, unknown> = { ...meta };
  let changed = false;
  for (const key of REDACTABLE_META_KEYS) {
    const value = next[key];
    if (value && typeof value === 'object') {
      next[key] = deepRedact(value);
      changed = true;
    }
  }
  return { meta: changed ? next : meta, changed };
}
```

- [ ] **Step 4: Replace `actionSanitizer` body to use the helper**

Replace the `actionSanitizer: <A extends AnyAction>(action: A): A => { ... },` property with:
```ts
  actionSanitizer: <A extends AnyAction>(action: A): A => {
    const { meta: nextMeta, changed } = redactActionMeta(
      action.meta as Record<string, unknown> | undefined
    );
    const ap = (action as A & { payload?: unknown }).payload;
    const nextPayload = ap && typeof ap === 'object' ? deepRedact(ap) : ap;
    const payloadChanged = nextPayload !== ap;
    return changed || payloadChanged
      ? ({ ...action, meta: nextMeta, payload: nextPayload } as A)
      : action;
  },
```
> Behavior identical: the original looped `arg`/`headers`/`request` with the same `value && typeof value === 'object'` guard and `{ ...meta }` copy-on-change semantics. `stateSanitizer` is unchanged.

- [ ] **Step 5: Type-check and run any covering suite**

Run:
```bash
docker compose exec -T dev bun x tsc -p tsconfig.json --noEmit
docker compose exec -T dev bun x jest dev-tools -v 2>/dev/null || echo "no direct suite (covered indirectly)"
```
Expected: tsc clean; suite PASS if one exists.

- [ ] **Step 6: Commit**

```bash
git add src/stores/dev-tools-options.ts
git commit -m "refactor(dev-tools): keyword-array sensitive check + extract meta redaction

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

### Task 4: Simplify `base-api` (return-statements + boolean-logic)

**Files:**
- Modify: `src/modules/user/features/auth/repositories/base-api.ts`
- Test (existing regression net): suites matching `base-api` (discover in Step 1)

- [ ] **Step 1: Discover and baseline coverage**

Run:
```bash
docker compose exec -T dev bun x jest base-api -v 2>/dev/null || echo "no direct base-api suite"
```
Expected: record PASS/absence. (`base-api.ts` is also in the working tree as Modified — preserve current behavior exactly.)

- [ ] **Step 2: Replace the `isNetworkError` boolean chain with a keyword array**

Replace the `private isNetworkError(message: string): boolean { ... }` method with:
```ts
  private static readonly NETWORK_ERROR_KEYWORDS = [
    'failed to fetch',
    'network',
    'connection',
    'timeout',
    'cors',
    'econnreset',
    'enotfound',
    'econnrefused',
    'enetunreach',
    'ehostunreach',
    'ecanceled',
    'canceled',
    'cancelled',
    'err_network',
  ];

  private isNetworkError(message: string): boolean {
    if (!message) return false;
    const m = message.toLowerCase();
    return BaseAPI.NETWORK_ERROR_KEYWORDS.some((keyword) => m.includes(keyword));
  }
```
> Identical keyword set and order; `.some()` short-circuits exactly as the `||` chain did.

- [ ] **Step 3: Extract HTTP-status mapping to collapse `handleApiError` returns**

Add a private method to the class (place directly above `handleApiError`):
```ts
  private mapHttpStatusToError(status: number, context: string, error: unknown): ApiError {
    const byStatus: Record<number, () => ApiError> = {
      400: () => new ValidationError({ message: `Invalid ${context.toLowerCase()} data`, status: 400 }),
      401: () => new AuthenticationError(),
      403: () => new ApiError('Forbidden', ApiErrorCodes.FORBIDDEN, 403, error),
      404: () => new ApiError(`${context} not found`, ApiErrorCodes.NOT_FOUND, 404, error),
      408: () => new ApiError('Request timed out. Please try again.', ApiErrorCodes.TIMEOUT, 408, error),
      422: () => new ValidationError({ message: `Unprocessable ${context.toLowerCase()} data`, status: 422 }),
      429: () => new ApiError('Too many requests. Please slow down.', ApiErrorCodes.RATE_LIMITED, 429, error),
      409: () => new ConflictError(`${context} conflict. Resource already exists.`),
      502: () => new ApiError('Service unavailable. Please try again later.', ApiErrorCodes.SERVER, status, error),
      503: () => new ApiError('Service unavailable. Please try again later.', ApiErrorCodes.SERVER, status, error),
      504: () => new ApiError('Service unavailable. Please try again later.', ApiErrorCodes.SERVER, status, error),
      500: () => new ApiError('Server error. Please try again later.', ApiErrorCodes.SERVER, 500, error),
    };
    const factory = byStatus[status];
    return factory
      ? factory()
      : new ApiError(`${context} failed`, ApiErrorCodes.UNKNOWN, status, error);
  }
```
> 502/503/504 originally fell through to one block returning `ApiError(..., error.status, ...)`; here each maps to a factory using `status` — identical output since `status === error.status` for that branch.

- [ ] **Step 4: Replace `handleApiError` body to delegate to the map**

Replace the `protected handleApiError(error: unknown, context: string): ApiError { ... }` body with:
```ts
  protected handleApiError(error: unknown, context: string): ApiError {
    if (isHttpError(error)) {
      if (error.status === 0 || this.isNetworkError(error.message)) {
        return new ApiError(
          'Network error. Please check your connection.',
          ApiErrorCodes.NETWORK,
          undefined,
          error
        );
      }
      return this.mapHttpStatusToError(error.status, context, error);
    }

    if (error instanceof Error && this.isAbortError(error)) {
      return new ApiError('Request canceled.', ApiErrorCodes.CANCELLED, undefined, error);
    }
    if (error instanceof Error && this.isNetworkError(error.message)) {
      return new ApiError(
        'Network error. Please check your connection.',
        ApiErrorCodes.NETWORK,
        undefined,
        error
      );
    }

    return new ApiError(`${context} failed. Please try again.`, ApiErrorCodes.UNKNOWN);
  }
```
> `isAbortError` unchanged. Member ordering: keep `handleApiError` then `mapHttpStatusToError` then `isAbortError` then `isNetworkError` — verify `@typescript-eslint/member-ordering` does not complain in Step 5 (all are instance methods after the static field + the `protected` then `private` grouping is preserved: `protected handleApiError`, then `private mapHttpStatusToError`, `private isAbortError`, `private isNetworkError`). If member-ordering errors, place `mapHttpStatusToError` after the existing private methods instead.

- [ ] **Step 5: Type-check + run covering suites**

Run:
```bash
docker compose exec -T dev bun x tsc -p tsconfig.json --noEmit
docker compose exec -T dev bun x jest base-api repositories -v 2>/dev/null || echo "covered indirectly via auth repo tests"
```
Expected: tsc clean; suites PASS.

- [ ] **Step 6: Commit**

```bash
git add src/modules/user/features/auth/repositories/base-api.ts
git commit -m "refactor(base-api): status map + keyword network check, single-exit error mapping

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

### Task 5: `login-form` — single-exit normalizer + jsx-no-bind

**Files:**
- Modify: `src/modules/user/features/auth/components/form-section/auth-forms/login-form.tsx`
- Test (existing regression net): `tests/unit/modules/user/features/auth/components/form-section/auth-forms/login-form.test.tsx`

- [ ] **Step 1: Baseline the login-form suite**

Run:
```bash
docker compose exec -T dev bun x jest tests/unit/modules/user/features/auth/components/form-section/auth-forms/login-form.test.tsx -v
```
Expected: PASS.

- [ ] **Step 2: Collapse `normalizeLoginErrorMessage` to a single exit**

Replace `export const normalizeLoginErrorMessage = (error: unknown): string => { ... };` with:
```ts
export const normalizeLoginErrorMessage = (error: unknown): string => {
  if (typeof error === 'string' && error.trim()) return error;
  if (error instanceof Error && error.message.trim()) return error.message;
  if (!isRecord(error)) return 'auth.errors.unknown';

  const serializedError = error as SerializedError;
  const candidates: Array<string | null> = [
    typeof serializedError.message === 'string' && serializedError.message.trim()
      ? serializedError.message
      : null,
    getNestedMessage(error.message),
    getNestedMessage(error.displayMessage),
    getNestedMessage(error.data),
  ];

  return candidates.find((c): c is string => Boolean(c)) ?? 'auth.errors.unknown';
};
```
> Same precedence order, same fallback. Three early returns remain (distinct type-narrowing guards, which the smell tolerates); the four message-source returns collapse into one.

- [ ] **Step 3: Hoist `handleLogin` into `useCallback`**

Change the import on line 2 from:
```ts
import { useState } from 'react';
```
to:
```ts
import { useCallback, useState } from 'react';
```
Replace the `const handleLogin = async (data: LoginUserDto): Promise<void> => { ... };` declaration with:
```ts
  const handleLogin = useCallback(
    async (data: LoginUserDto): Promise<void> => {
      setIsSubmitting(true);
      setError('');

      try {
        await login(data);
      } catch (err) {
        const message = normalizeLoginErrorMessage(err);
        setError(t('sign_in.errors.login', { reason: t(message) }));
      } finally {
        setIsSubmitting(false);
      }
    },
    [login, t]
  );
```
> `setError`/`setIsSubmitting` are stable setters; `login` and `t` are the real deps. JSX `onSubmit={handleLogin}` is now a stable reference — clears `react/jsx-no-bind`.

- [ ] **Step 4: Re-run the login-form suite + type-check**

Run:
```bash
docker compose exec -T dev bun x jest tests/unit/modules/user/features/auth/components/form-section/auth-forms/login-form.test.tsx -v
docker compose exec -T dev bun x tsc -p tsconfig.json --noEmit
```
Expected: PASS; tsc clean.

- [ ] **Step 5: Commit**

```bash
git add src/modules/user/features/auth/components/form-section/auth-forms/login-form.tsx
git commit -m "refactor(login-form): single-exit error normalizer, memoize submit handler

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

### Task 6: `password.ts` — single-exit validator

**Files:**
- Modify: `src/modules/user/features/auth/components/form-section/validations/password.ts`
- Test (existing regression net): suites matching `password` validation (discover in Step 1)

- [ ] **Step 1: Discover and baseline coverage**

Run:
```bash
docker compose exec -T dev bun x jest validations password -v 2>/dev/null || echo "covered via form/password-field tests"
```
Expected: record PASS/absence.

- [ ] **Step 2: Replace the if/return chain with a rules table + single exit**

Replace the `createPasswordValidator` function body (the inner `(value: string) => { ... }`) so the whole export reads:
```ts
const createPasswordValidator =
  <TFieldValues extends FieldValues>(t: TFunction): Validate<string, TFieldValues> =>
  (value: string) => {
    const messages: Record<ValidationPswdMessageKey, string> = {
      invalidLength: t('sign_up.form.password_input.error_length'),
      numberRequired: t('sign_up.form.password_input.error_numbers'),
      uppercaseRequired: t('sign_up.form.password_input.error_uppercase'),
      lowercaseRequired: t('sign_up.form.password_input.error_lowercase'),
      fieldRequired: t('sign_up.form.password_input.required'),
    };

    const rules: Array<{ valid: boolean; message: string }> = [
      { valid: Boolean(value?.trim()), message: messages.fieldRequired },
      { valid: isLengthValid(value), message: messages.invalidLength },
      { valid: hasNumber(value), message: messages.numberRequired },
      { valid: hasUppercase(value), message: messages.uppercaseRequired },
      { valid: hasLowercase(value), message: messages.lowercaseRequired },
    ];

    const failed = rules.find((rule) => !rule.valid);
    return failed ? failed.message : true;
  };
```
> Order preserved → first failing rule wins, exactly as the original short-circuiting `if` chain. Note: original guarded `!value?.trim()` *before* calling `isLengthValid(value)`; here all `valid` flags are computed eagerly, but `isLengthValid`/`hasNumber`/`hasUppercase`/`hasLowercase` are total functions over strings (the helpers use `.length`/regex which are safe on `''`; `value` is typed `string`), so eager evaluation is safe and the returned message is unchanged.

- [ ] **Step 3: Type-check + run covering suite**

Run:
```bash
docker compose exec -T dev bun x tsc -p tsconfig.json --noEmit
docker compose exec -T dev bun x jest password validations -v 2>/dev/null || echo "covered indirectly"
```
Expected: tsc clean; PASS.

- [ ] **Step 4: Commit**

```bash
git add src/modules/user/features/auth/components/form-section/validations/password.ts
git commit -m "refactor(password-validator): rules table with single exit

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

### Task 7: `is-api-error` + `fetch-https-client` boolean-logic

**Files:**
- Modify: `src/modules/user/helpers/is-api-error.ts`
- Modify: `src/services/https-client/fetch-https-client.ts`

- [ ] **Step 1: Simplify `is-api-error.ts`**

Replace the full contents with:
```ts
interface APIError {
  code: string;
  message: string;
}

const hasStringProp = (obj: Record<string, unknown>, key: string): boolean =>
  key in obj && typeof obj[key] === 'string';

function isAPIError(err: unknown): err is APIError {
  if (typeof err !== 'object' || err === null) return false;
  const record = err as Record<string, unknown>;
  return hasStringProp(record, 'code') && hasStringProp(record, 'message');
}

export default isAPIError;
```
> Same truth table: object, non-null, string `code`, string `message`. One early return is a type guard (tolerated); the long `&&` chain is gone.

- [ ] **Step 2: Simplify the `isJsonBody` expression in `fetch-https-client.ts`**

In `createRequestConfig`, replace the block from `const isFormData = ...` through `const isJsonBody = ...;` (lines defining `isFormData`, `isBlob`, `isArrayBuffer`, `isReadableStream`, `isString`, `isJsonBody`) with:
```ts
    const hasGlobal = (name: string): boolean =>
      typeof (globalThis as Record<string, unknown>)[name] !== 'undefined';
    const isNonJsonBodyType =
      (hasGlobal('FormData') && body instanceof FormData) ||
      (hasGlobal('Blob') && body instanceof Blob) ||
      (hasGlobal('ArrayBuffer') && body instanceof ArrayBuffer) ||
      (hasGlobal('ReadableStream') && body instanceof ReadableStream) ||
      typeof body === 'string';
    const isJsonBody = hasBody && !isNonJsonBodyType;
```
> Equivalent: `isJsonBody` was `hasBody && !isFormData && !isBlob && !isArrayBuffer && !isReadableStream && !isString`, i.e. `hasBody && !(any non-JSON body type)`. The `typeof X !== 'undefined'` guards are preserved via `hasGlobal`. `hasBody` is still defined above as `body !== undefined`.

- [ ] **Step 3: Type-check + run https-client / helper suites**

Run:
```bash
docker compose exec -T dev bun x tsc -p tsconfig.json --noEmit
docker compose exec -T dev bun x jest is-api-error fetch-https-client https-client -v 2>/dev/null || echo "covered indirectly via repo/service tests"
```
Expected: tsc clean; suites PASS.

- [ ] **Step 4: Commit**

```bash
git add src/modules/user/helpers/is-api-error.ts src/services/https-client/fetch-https-client.ts
git commit -m "refactor: extract predicates to flatten boolean-logic smells

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

### Task 8: jsx-no-bind in components (password-field, user-options, form-section, ui-form-input-field)

**Files:**
- Modify: `src/modules/user/features/auth/components/form-section/components/password-field.tsx`
- Modify: `src/modules/user/features/auth/components/form-section/components/user-options/index.tsx`
- Modify: `src/modules/user/features/auth/components/form-section/index.tsx`
- Modify: `src/components/ui-form-input-field/index.tsx`
- Test (existing regression net): `tests/unit/modules/user/features/auth/components/form-section/index.test.tsx` + password-field/user-options suites

- [ ] **Step 1: `password-field.tsx` — memoize both handlers**

Change line 3 `import { useState } from 'react';` to:
```ts
import { useCallback, useState } from 'react';
```
Replace `const handleClickShowPassword = (): void => setShowPassword((prev) => !prev);` with:
```ts
  const handleClickShowPassword = useCallback((): void => {
    setShowPassword((prev) => !prev);
  }, []);

  const handleMouseDownPassword = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>): void => {
      e.preventDefault();
    },
    []
  );
```
Add `import React from 'react';` is **not** needed (only the `React.MouseEvent` type). Use the type-only form: change line 3 to also import the type — instead use:
```ts
import { useCallback, useState, type MouseEvent } from 'react';
```
and type the handler param as `MouseEvent<HTMLButtonElement>` (drop the `React.` prefix). Then in JSX replace `onMouseDown={(e) => e.preventDefault()}` with `onMouseDown={handleMouseDownPassword}` and leave `onClick={handleClickShowPassword}` as-is (now stable).

- [ ] **Step 2: `user-options/index.tsx` — memoize `onChange`**

Change line 2 `import { useState } from 'react';` to:
```ts
import { useCallback, useState } from 'react';
```
Replace `const onChange = (): void => setIsChecked(!isChecked);` with:
```ts
  const handleCheckboxChange = useCallback((): void => {
    setIsChecked((prev) => !prev);
  }, []);
```
In JSX replace `onChange={onChange}` with `onChange={handleCheckboxChange}`.
> `setIsChecked((prev) => !prev)` is equivalent to `setIsChecked(!isChecked)` and removes the `isChecked` dep so the callback is stable.

- [ ] **Step 3: `form-section/index.tsx` — memoize the inert ref callback**

`useCallback` is already imported. Add, next to the other `useCallback` handlers (after `handleRegistrationViewChange`):
```ts
  const setProviderButtonsInert = useCallback(
    (el: HTMLDivElement | null): void => {
      if (!el) return;
      if (showNotification) {
        el.setAttribute('inert', '');
      } else {
        el.removeAttribute('inert');
      }
    },
    [showNotification]
  );
```
Move the `const showNotification = mode === 'register' && registrationView !== 'form';` line to **above** this `useCallback` (it must be declared before being referenced in the dep array). In JSX replace the inline `ref={(el: HTMLDivElement | null) => { ... }}` with `ref={setProviderButtonsInert}`.

- [ ] **Step 4: `ui-form-input-field/index.tsx` — memoize the Controller render prop**

`React` is already imported. Add `useCallback` usage — change line 4 `import React from 'react';` to:
```ts
import React, { useCallback } from 'react';
```
Inside the component, before the `return`, add:
```ts
  const renderField = useCallback(
    ({
      field: { ref, ...field },
      fieldState,
    }: Parameters<
      React.ComponentProps<typeof Controller<T>>['render']
    >[0]): React.ReactElement => (
      <TextField
        {...props}
        {...field}
        inputRef={ref}
        error={fieldState.invalid}
        helperText={fieldState.error?.message ?? props.helperText}
        sx={sx}
      />
    ),
    [props, sx]
  );
```
Replace the inline `render={({ field: { ref, ...field }, fieldState }): React.ReactElement => ( ... )}` prop with `render={renderField}`.
> If the `Parameters<...>` type proves unwieldy under `tsc`, fall back to importing `ControllerRenderProps`/`ControllerFieldState` from `react-hook-form` and typing the arg as `{ field: ControllerRenderProps<T>; fieldState: ControllerFieldState }`. The `/* eslint-disable react/jsx-props-no-spreading */` header stays.

- [ ] **Step 5: Type-check + run component suites**

Run:
```bash
docker compose exec -T dev bun x tsc -p tsconfig.json --noEmit
docker compose exec -T dev bun x jest tests/unit/modules/user/features/auth/components/form-section -v
```
Expected: tsc clean; all form-section suites PASS.

- [ ] **Step 6: Commit**

```bash
git add src/modules/user/features/auth/components/form-section/components/password-field.tsx src/modules/user/features/auth/components/form-section/components/user-options/index.tsx src/modules/user/features/auth/components/form-section/index.tsx src/components/ui-form-input-field/index.tsx
git commit -m "refactor: hoist inline JSX handlers to useCallback (jsx-no-bind)

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

### Task 9: jsx-no-bind in tests + dedupe `fill-form.ts`

**Files:**
- Modify: `tests/unit/modules/user/features/auth/components/form-section/auth-forms/login-form.test.tsx`
- Modify: `tests/unit/modules/user/features/auth/components/form-section/index.test.tsx`
- Modify: `tests/e2e/modules/user/features/auth/components/form-section/auth-forms/utils/fill-form.ts`

- [ ] **Step 1: `login-form.test.tsx` — extract the inline submit handler**

In the `UIForm` mock (the `default:` factory around lines 60–80), inside the render function body (after `mockUIForm(props);`, before `return (`), add:
```tsx
    const handleSubmitClick = (): Promise<void> =>
      props.onSubmit({ email: 'user@example.com', password: 'secret123' });
```
Replace `onClick={() => props.onSubmit({ email: 'user@example.com', password: 'secret123' })}` with `onClick={handleSubmitClick}`.

- [ ] **Step 2: `form-section/index.test.tsx` — extract both inline handlers**

This file has the registration-form mock duplicated in two `jest.mock` factories (≈lines 58–70 and ≈143–157), each with `onClick={() => onViewChange?.('success')}`. In **each** factory's component body, change the arrow component to a block body and add a named handler:
```tsx
    default: ({ onViewChange }: { onViewChange?: (view: string) => void }): ReactElement => {
      const triggerSuccess = (): void => onViewChange?.('success');
      return (
        <div data-testid="registration-form">
          <button type="button" data-testid="trigger-success-view" onClick={triggerSuccess} />
        </div>
      );
    },
```
Apply this to **both** occurrences.

- [ ] **Step 3: `auth-error-boundary/index.test.tsx` — confirm scope**

Run:
```bash
grep -n "onClick={() =>\|=> props\.\|=> on" tests/unit/modules/user/features/auth/components/auth-error-boundary/index.test.tsx || echo "no jsx-no-bind site here"
```
The reported finding for this file was the `@testing-library/user-event` import (Task 10 verify-only), not jsx-no-bind. If the grep returns a site, extract it to a named handler the same way as Step 1; otherwise no change.

- [ ] **Step 4: Dedupe `fill-form.ts` (qlty:similar-code between email/password fillers)**

Replace the bodies of `fillEmailInput` and `fillPasswordInput` by extracting the shared loop. Replace both functions with:
```ts
async function assertFieldErrors(
  page: Page,
  input: Locator,
  expectations: ReadonlyArray<{ errorText: string } & Record<string, string>>,
  valueKey: 'email' | 'password'
): Promise<void> {
  await page.locator('button', { hasText: signUpButton }).click();
  for (const expectation of expectations) {
    await input.fill(expectation[valueKey]);
    await input.blur();
    const error: Locator = page
      .locator(requiredErrorSelector, { hasText: expectation.errorText })
      .first();

    await expect(error).toBeVisible();
  }
}

export async function fillEmailInput(page: Page, user: RegisterUserDto): Promise<void> {
  const emailInput: Locator = page.getByPlaceholder(placeholderEmail);
  await assertFieldErrors(page, emailInput, expectationsEmail, 'email');
  await emailInput.fill(user.email);
}

export async function fillPasswordInput(page: Page, user: RegisterUserDto): Promise<void> {
  const passwordInput: Locator = page.getByPlaceholder(placeholderPassword);
  await assertFieldErrors(page, passwordInput, expectationsPassword, 'password');
  await passwordInput.fill(user.password);
}
```
> `fillInitialsInput` is unchanged (different shape). `expectationsEmail[i].email` and `expectationsPassword[i].password` are read via `valueKey` — verify the constant shapes in `../constants/constants` expose `.email`/`.password` + `.errorText`; if a field name differs, adjust `valueKey` typing accordingly. Behavior (click signup, iterate expectations, assert visible error, then fill final value) is identical.

- [ ] **Step 5: Type-check + run the affected unit suites (e2e file is type-only here)**

Run:
```bash
docker compose exec -T dev bun x tsc -p tsconfig.json --noEmit
docker compose exec -T dev bun x jest tests/unit/modules/user/features/auth/components/form-section/auth-forms/login-form.test.tsx tests/unit/modules/user/features/auth/components/form-section/index.test.tsx -v
```
Expected: tsc clean; both suites PASS. (The Playwright util compiles but is exercised by `make test-e2e`, run in Task 10.)

- [ ] **Step 6: Commit**

```bash
git add tests/unit/modules/user/features/auth/components/form-section/auth-forms/login-form.test.tsx tests/unit/modules/user/features/auth/components/form-section/index.test.tsx tests/e2e/modules/user/features/auth/components/form-section/auth-forms/utils/fill-form.ts
git commit -m "refactor(tests): named handlers for jsx-no-bind, dedupe fill-form helpers

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

### Task 10: Verify extraneous-deps false positive + full verification pass

**Files:** none (verification + at most an ESLint-config note; no `package.json` dependency changes — `zod` is in `dependencies`, `storybook` & `@testing-library/user-event` in `devDependencies`, and the flat config already allows devDependencies in `testFilePatterns`).

- [ ] **Step 1: Run the real ESLint in Docker and inspect the deps findings**

Run:
```bash
make lint-eslint 2>&1 | tee /tmp/eslint-out.txt
grep -n "no-extraneous-dependencies" /tmp/eslint-out.txt || echo "NO extraneous-dependency errors under project config"
```
Expected: **no `import/no-extraneous-dependencies` errors** — confirming the qlty-reported ones are false positives from qlty's own ESLint sandbox (different package resolution). Record the result in the final report.

- [ ] **Step 2: Decide deps action from evidence**

- If Step 1 shows **no errors**: no code change. The qlty findings are environmental/stale; document this. Do **not** add or move any dependency.
- If Step 1 **does** show an `import/no-extraneous-dependencies` error: it is a resolver issue, not a missing package (all three are declared). Fix by adjusting `eslint.config.mjs` `importNoExtraneousDependenciesOptions` (`packageDir`/`devDependencies` globs) only — still no `package.json` dependency additions. Re-run `make lint-eslint` until clean.

- [ ] **Step 3: Full lint + type pass**

Run:
```bash
make lint-eslint
make lint-tsc
```
Expected: both succeed with **zero** errors (warnings such as the now-resolved `jsx-no-bind` should be gone; any pre-existing unrelated warnings are out of scope — note them, don't fix).

- [ ] **Step 4: Full unit suite (client + server)**

Run:
```bash
make test-unit-all
```
Expected: all suites PASS, including `auth-skeleton.*`, `login-form`, `form-section`, `schema-fetcher` (server env), `base-api`, `dev-tools-options`.

- [ ] **Step 5: Visual regression (the one real behavior risk — style extraction)**

Run:
```bash
make start-prod
make test-visual
```
Expected: **no visual diffs** for auth skeleton / form-section. If a diff appears, the style extraction in Task 1 changed rendered output — diff the new `auth-form-shared-styles.ts` against the pre-refactor `form-section/styles.ts` + canonical skeleton blocks, fix the discrepancy, and re-run. Do **not** blanket-update snapshots.

- [ ] **Step 6: E2E (exercises the refactored `fill-form.ts`)**

Run:
```bash
docker compose -f docker-compose.test.yml exec playwright bunx playwright test tests/e2e/modules/user/features/auth -g "email|password" 2>&1 | tail -20
```
Expected: the email/password validation specs that use `fillEmailInput`/`fillPasswordInput` PASS. If the runner needs the full e2e bootstrap, fall back to `make test-e2e` and scope to the auth specs.

- [ ] **Step 7: (Optional) qlty spot-check**

Run:
```bash
command -v qlty >/dev/null && qlty smells --all 2>/dev/null | grep -E "function-complexity|identical-code|similar-code|return-statements|boolean-logic" || echo "qlty CLI not available locally — rely on CI comment"
```
Expected: none of the addressed findings remain (or: qlty CLI absent — the CI qlty comment is the authority).

- [ ] **Step 8: Final report (no commit — verification only)**

Summarize: every finding category cleared, the deps findings confirmed false-positive (with Step 1 evidence), all Docker suites green. List any out-of-scope warnings observed but intentionally left.

---

## Self-Review

**Spec coverage:**
- Style duplication (identical/similar-code) → Task 1 (delete orphan + shared module). ✓
- function-complexity `fetchAndSaveSchema` → Task 2; `actionSanitizer` → Task 3. ✓
- return-statements `handleApiError` → Task 4; `normalizeLoginErrorMessage` → Task 5; `createPasswordValidator` → Task 6. ✓
- boolean-logic `base-api` → Task 4; `dev-tools-options` → Task 3; `is-api-error` + `fetch-https-client` → Task 7. ✓
- jsx-no-bind components → Task 8; test files → Task 9. ✓
- `fill-form.ts` similar-code → Task 9. ✓
- import/no-extraneous-dependencies (zod/storybook/user-event) → Task 10 verify-only, no manifest change (matches spec "no dependency manifest changes"). ✓
- Verification all-in-Docker, visual as the one risk → Task 10. ✓

**Placeholder scan:** No TBD/TODO; every code step has complete code. Conditional fallbacks (member-ordering in Task 4 Step 4, Controller type in Task 8 Step 4, constants shape in Task 9 Step 4, deps branch in Task 10 Step 2) are explicit decision rules with concrete alternatives, not placeholders.

**Type consistency:** `fieldGapMargins`/`formSection`/`formWrapper` exported from `auth-form-shared-styles.ts` (Task 1 Step 2), re-exported by `form-section/styles.ts` as `fieldGapMargins` (Task 1 Step 4) so `form-section/components/styles.ts`'s existing `import { fieldGapMargins } from '@/modules/user/features/auth/components/form-section/styles'` keeps resolving — no change needed there. `SchemaFetchConfig`/`resolveSchemaConfig`/`attemptSchemaFetch` consistent across Task 2 steps. `redactActionMeta`/`REDACTABLE_META_KEYS` consistent in Task 3. `mapHttpStatusToError`/`NETWORK_ERROR_KEYWORDS` consistent in Task 4. Handler names (`handleLogin`, `handleMouseDownPassword`, `handleCheckboxChange`, `setProviderButtonsInert`, `renderField`, `assertFieldErrors`, `triggerSuccess`, `handleSubmitClick`) each defined once and referenced consistently.

## Notes for the executor

- One-shot sweep: per-task commits keep history bisectable; the **single full verification pass is Task 10**. Per-task `tsc`/targeted-jest steps are fast guards, not the full gate.
- All refactors are behavior-preserving; existing suites are the regression net. If any baseline (Step 1 of a task) is already red before you touch code, STOP and report — do not refactor on a red baseline.
- `base-api.ts` is already Modified in the working tree (pre-existing branch work). Preserve its current behavior; only apply the structural changes in Task 4.
- Never blanket-update visual snapshots; a diff means the style extraction is wrong.
