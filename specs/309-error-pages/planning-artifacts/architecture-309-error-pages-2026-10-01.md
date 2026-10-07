---
status: 'complete'
workflowType: 'architecture'
stepsCompleted:
  - 'step-01-init'
  - 'step-02-context'
  - 'step-03-starter'
  - 'step-04-decisions'
  - 'step-05-patterns'
  - 'step-06-structure'
  - 'step-07-validation'
  - 'step-08-complete'
project_name: 'crm'
date: '2026-10-01'
issue: 309
branch: 'feat/309-error-pages'
base: 'origin/main cff55203'
author: 'architect (Winston), autonomous run'
inputDocuments:
  - 'https://github.com/VilnaCRM-Org/crm/issues/309'
  - 'specs/309-error-pages/planning-artifacts/research-309-error-pages-2026-10-01.md'
  - 'specs/309-error-pages/planning-artifacts/brief-309-error-pages-2026-10-01.md'
  - 'specs/309-error-pages/planning-artifacts/prd-309-error-pages-2026-10-01.md'
  - 'Figma file xZ7ccrH6d4QyqLQsayFSEX, nodes 143:12154, 143:12166, 143:12178, 172:6675, 172:6914'
  - 'CLAUDE.md'
  - '.claude/react-sdlc.yml'
  - 'src/components/error-boundary/route-error.tsx'
  - 'src/components/layouts/footer-loader.ts'
  - 'src/components/layouts/app-layout.tsx'
  - 'src/providers/mui-theme/themed-chunk-loader.ts'
  - 'src/components/types/providers/index.ts'
  - 'src/lib/reliability/chunk-retry-loader.ts'
  - 'src/routes/route-mapper.tsx'
  - 'src/routes/app-routes.ts'
  - 'src/routes/route-paths.ts'
  - 'src/components/ui-button/index.tsx'
  - 'src/components/ui-typography/index.tsx'
  - 'src/components/ui-breakpoints/index.ts'
  - 'src/styles/colors.ts'
  - 'src/features/home/styles.ts'
  - 'src/components/error-boundary/styles.ts'
  - 'tests/utils/a11y/axe-config.ts'
  - 'tests/e2e/route-coverage.tsv'
  - 'tests/e2e/a11y/routes.a11y.spec.ts'
  - 'tests/visual/constants.ts'
  - 'tests/unit/tooling/performance-serving.test.ts'
  - '.storybook/main.ts'
  - 'docs/adr/template.md'
  - 'docs/adr/README.md'
  - 'node_modules/axe-core/axe.js (color-contrast rule metadata and matcher)'
  - '.github/workflows/*.yml (job names)'
  - 'PR #230 head src/routes/route-paths.ts (RBAC)'
---

# Architecture: 404 / 403 / 5xx error pages from Figma (#309)

**Author:** architect (Winston), autonomous BMAD run. **Date:** 2026-10-01. **Issue:**
[#309](https://github.com/VilnaCRM-Org/crm/issues/309). **Status:** complete.

Predecessors: [technical research](./research-309-error-pages-2026-10-01.md) ("R§n"),
[product brief](./brief-309-error-pages-2026-10-01.md) ("B§n") and
[PRD](./prd-309-error-pages-2026-10-01.md) ("FR-n", "NFR-n", appendix "A.n"). This document turns
the PRD's 20 FRs and 22 NFRs into file-level decisions an implementer can follow without
re-deriving them. It does not re-open any product owner decision (PRD UD-1 to UD-10).

## 1. Context and stack fit

### 1.1 Fit statement

React 19.3 + TypeScript SPA, MUI 9 over Emotion, React Router 7 (`createBrowserRouter`, built
once in `src/routes/routes.tsx`), tsyringe DI (not used here: the pages need no collaborator),
i18next with per-feature catalogs merged into the eager `src/i18n/localization.json`, RSBuild
(Rspack) with `pluginSvgr({ mixedImport: true, exportType: 'named' })`. App-shell pages live in
the shared component layer (`src/components/<kebab>/`), not in `src/modules/*`: the existing
404 page already sits at `src/components/not-found/`, and a module would need a README,
CODEOWNERS and the `make new-module` scaffold for pages that own no domain (R§6). The new
code slots into that layer, into the existing `app.shell` route contract and into the existing
error-boundary folder; no new top-level directory is created.

### 1.2 Requirements that shape the design

| Driver                                                               | Source                  | Architectural consequence                                                         |
| -------------------------------------------------------------------- | ----------------------- | --------------------------------------------------------------------------------- |
| One composition, three configurations                                | FR-1, jscpd 70 tokens   | One `ErrorPage` fed a variant id; per-status data in one table                    |
| `RouteError` is eager and must stay MUI-free                         | NFR-10, ADR-017         | Status page reached only through a lazy, themed loader                            |
| Status pages reachable from today's render-only route contract       | FR-6, UD-2              | Detector also reads render-thrown `Response` and `data()` values (section 5.2)    |
| `RouteError` must pass `variant` and `landmark` into the lazy page   | FR-6, FR-11             | `ThemedChunkLoader` learns to forward props (section 6.2)                         |
| Exactly one footer per document                                      | FR-16                   | Footer rendered iff `landmark === 'main'`                                         |
| Pixel parity at 1440 / 1024 / 375 with numeric tolerances            | FR-12 to FR-15, NFR-1-3 | One geometry data file mirrors appendix A; shared desktop/tablet sub-records      |
| Decorative digits fail 1.4.3 (2.37:1, 1.58:1)                        | NFR-7, NFR-8            | DOM-text digits in an `aria-hidden` box plus one scoped exception (section 8.4)   |
| White on `#1EAEFF` button labels fail 1.4.3                          | NFR-8                   | One scoped `A11Y_EXCEPTIONS` entry on a stable `id` scope (section 10.4)          |
| 100 % coverage and 100 % mutation, direct test per file              | NFR-15, NFR-16          | Small files, static literals loaded in-test, every new file has a mirrored test   |
| rust-code-analysis per-file and per-function caps                    | NFR-18                  | One component per file; six area style classes, one breakpoint per method         |
| No ADR-drift trigger, no new dependency, no budget or threshold edit | NFR-10, NFR-20          | `registry.ts`, `route-composer.tsx`, `routes.tsx`, `src/config/**` stay untouched |

## 2. Decision summary

| ID   | Decision                                                                                                                                                                                                   | Section |
| ---- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------- |
| D-1  | Shared presentational `ErrorPage` in `src/components/error-page/`, driven by `variant: 'notFound' \| 'forbidden' \| 'serverError'` and `landmark`                                                          | 3, 4    |
| D-2  | Per-status data (`ERROR_PAGE_VARIANTS`) and per-breakpoint geometry (`ERROR_PAGE_GEOMETRY`, desktop/tablet-identical sub-records declared once) are data-only `.ts` tables in the lazy chunk               | 4, 8.3  |
| D-3  | `RouteError` becomes a two-way dispatcher; today's body moves unchanged into `RouteErrorFallback`                                                                                                          | 5       |
| D-4  | `ErrorPageStatusDetector` (eager, MUI-free) maps status 403 / 404 / 500-599, read from a router error response, a render-thrown `Response` or a `data()` value, to a variant id, everything else to `null` | 5.2     |
| D-5  | `RouteErrorPage` lazy-loads `@/components/error-page` (`webpackChunkName: "error-page"`) through `ThemedChunkLoader` + `ChunkRetryLoader`; on failure it renders `RouteErrorFallback`                      | 5.3, 6  |
| D-6  | `ThemedChunkLoader` and `ComponentModule` gain an optional props type parameter so the themed wrapper forwards props; existing call sites are unchanged                                                    | 6.2     |
| D-7  | Illustration assets live in `src/assets/illustrations/error-page/`, imported as svgr `ReactComponent`s, coloured through `currentColor`; tab and dot are CSS                                               | 7       |
| D-8  | Three compositions: desktop `> 1024 px`, tablet `768-1024 px`, mobile `< 768 px`; parity claimed only at 1440, 1024 and 375                                                                                | 8       |
| D-9  | New colour tokens in `customColors` (`src/styles/colors.ts`); text sizes in `rem`, geometry in `px`                                                                                                        | 9       |
| D-10 | Home action is `UIButton to="/"` (anchor); "Запросити доступ" is `UIButton` with no `to`, rendering `<button type="button">` with no handler                                                               | 10      |
| D-11 | Routes `forbidden: '/forbidden'`, `serverError: '/server-error'` added to `ROUTE_PATHS` and to the `app.shell` contract as `guard: 'public'` lazy pages                                                    | 11      |
| D-12 | Catalog namespace `error_page.*` owned by `src/components/error-page/i18n/`; `not_found.*` deleted; `route_fallback.loading` moves to `src/components/route-fallback/i18n/`                                | 13      |
| D-13 | New ADR-018 records the status branch in front of the recovery model and the lost in-place retry for 5xx route responses; ADR-007 gains one Links line                                                     | 16      |

## 3. Component tree and file placement

### 3.1 Runtime tree

```text
Catch-all / forbidden / server-error route (mapped page, lazy, themed by the route mapper)
└─ NotFound | Forbidden | ServerError     src/components/{not-found,forbidden,server-error}/
   └─ ErrorPage variant=… landmark="main"      src/components/error-page/index.tsx

Route error (errorElement on root, layouts and every mapped page; eager)
└─ RouteError { landmark }                     src/components/error-boundary/route-error.tsx
   ├─ variant !== null → RouteErrorPage       error-boundary/route-error-page.tsx
   │   └─ <Suspense fallback={<RouteFallback />}>
   │      └─ lazy(errorPageLoader)             error-page chunk, themed, props forwarded
   │         └─ ErrorPage variant=… landmark=…
   │         (chunk failed after retry → RouteErrorFallback { landmark })
   └─ variant === null → RouteErrorFallback   error-boundary/route-error-fallback.tsx
      └─ ErrorFallback (unchanged)

ErrorPage { variant, landmark }                index.tsx
├─ Box component = main | section[aria-labelledby="error-page-title"], lang, #FBFBFB
│  └─ ErrorPageComposition { variant }        error-page-composition.tsx  (position: relative)
│     ├─ ErrorPageIllustration                error-page-illustration.tsx (aria-hidden layer)
│     │   tab (CSS), curve (svg), diamond (svg), dot (CSS), dot columns (svg), dot rows (svg)
│     ├─ ErrorPageDigits { glyphs, colors }   error-page-digits.tsx       (#error-page-digits, aria-hidden)
│     └─ ErrorPageCard { variant }            error-page-card.tsx
│        ├─ h1#error-page-title tabIndex=-1   (focused on mount)
│        ├─ p (status code, visually hidden)  error_page.<variant>.code
│        ├─ p (description)
│        └─ ErrorPageActions { variant }      error-page-actions.tsx  #error-page-actions
│           ├─ UIButton to="/" (contained | outlined)
│           └─ UIButton type="button" (403 only, inert)
└─ UIFooter                                   only when landmark === 'main'
```

### 3.2 Files

"Chunk" is where the file's bytes land: **eager** (reachable statically from `src/index.tsx`),
**error-page** (the shared lazy chunk) or the named page chunk. Every row with a `src` file has
a direct, mirrored unit test (section 15).

| File                                                               | Kind                                    | Chunk        | Purpose                                                                             |
| ------------------------------------------------------------------ | --------------------------------------- | ------------ | ----------------------------------------------------------------------------------- |
| `src/components/error-page/index.tsx`                              | component `ErrorPage`                   | error-page   | Landmark, `lang`, page title, background, composition, conditional footer           |
| `src/components/error-page/components/error-page-composition.tsx`  | component                               | error-page   | Positioned 614 / 474 / 350.348 box; stacks illustration, digits, card               |
| `src/components/error-page/components/error-page-illustration.tsx` | component                               | error-page   | All decoration, `aria-hidden="true"`, svgs `focusable="false"`                      |
| `src/components/error-page/components/error-page-digits.tsx`       | component                               | error-page   | `#error-page-digits` box, three DOM-text glyph spans                                |
| `src/components/error-page/components/error-page-card.tsx`         | component                               | error-page   | Focused `h1`, hidden status-code line, description, actions                         |
| `src/components/error-page/components/error-page-actions.tsx`      | component                               | error-page   | Home anchor and the inert request-access button                                     |
| `src/components/error-page/config/error-page-variants.ts`          | data table `ERROR_PAGE_VARIANTS`        | error-page   | Glyphs, digit colours, i18n keys, home appearance, request-access flag per status   |
| `src/components/error-page/config/error-page-geometry.ts`          | data table `ERROR_PAGE_GEOMETRY`        | error-page   | Appendix A numbers per breakpoint (the parity reference)                            |
| `src/components/error-page/config/error-page-media.ts`             | data `ERROR_PAGE_MEDIA`                 | error-page   | The two media-query strings, built from `ui-breakpoints` values                     |
| `src/components/error-page/styles/responsive-styles.ts`            | class `ErrorPageResponsiveStyles`       | error-page   | `compose(desktop, tablet, mobile)`: one fragment per breakpoint into media blocks   |
| `src/components/error-page/styles/error-page-styles.ts`            | class `ErrorPageStyles`                 | error-page   | Landmark, composition                                                               |
| `src/components/error-page/styles/card-styles.ts`                  | class `ErrorPageCardStyles`             | error-page   | Card, title, description                                                            |
| `src/components/error-page/styles/digit-styles.ts`                 | class `ErrorPageDigitStyles`            | error-page   | Digit frame, glyph positions                                                        |
| `src/components/error-page/styles/illustration-styles.ts`          | class `ErrorPageIllustrationStyles`     | error-page   | Tab, curve, diamond                                                                 |
| `src/components/error-page/styles/dot-styles.ts`                   | class `ErrorPageDotStyles`              | error-page   | Dot, dot columns, dot rows                                                          |
| `src/components/error-page/styles/action-styles.ts`                | class `ErrorPageActionStyles`           | error-page   | Actions row, contained and outlined button `sx`                                     |
| `src/components/error-page/i18n/{en,uk}.json`                      | catalog                                 | eager (json) | `error_page.*`                                                                      |
| `src/components/not-found/not-found.tsx`                           | page (reworked in place)                | not-found    | `<ErrorPage variant="notFound" landmark="main" />`                                  |
| `src/components/forbidden/forbidden.tsx`                           | page (new)                              | forbidden    | `<ErrorPage variant="forbidden" landmark="main" />`                                 |
| `src/components/server-error/server-error.tsx`                     | page (new)                              | server-error | `<ErrorPage variant="serverError" landmark="main" />`                               |
| `src/components/error-boundary/route-error.tsx`                    | component (rewritten as dispatcher)     | eager        | `useRouteError()` → detector → page or fallback                                     |
| `src/components/error-boundary/route-error-fallback.tsx`           | component (body moved from route-error) | eager        | Today's `RouteError` logic, unchanged                                               |
| `src/components/error-boundary/route-error-page.tsx`               | component                               | eager        | `Suspense` + module-level `lazy` over `errorPageLoader`, keyed by `location.key`    |
| `src/components/error-boundary/error-page-loader.ts`               | instance `errorPageLoader`              | eager        | `new ThemedChunkLoader<ErrorPageProps>(new ChunkRetryLoader(import…), shellLoader)` |
| `src/components/error-boundary/error-page-status-detector.ts`      | class `ErrorPageStatusDetector`         | eager        | Route error (router response, thrown `Response`, `data()`) → variant id or `null`   |
| `src/components/types/error-page/index.ts`                         | types only                              | erased       | Variant id, variant, props, geometry and style-sheet types                          |
| `src/components/types/providers/index.ts`                          | types only (edited)                     | erased       | `ComponentModule<TProps>` gains a default type parameter                            |
| `src/providers/mui-theme/themed-chunk-loader.ts`                   | class (edited)                          | eager        | Generic over props; `Themed(props)` forwards them to the content                    |
| `src/assets/illustrations/error-page/curve.svg`                    | asset                                   | error-page   | Dashed curve rebuilt as one stroked path                                            |
| `src/assets/illustrations/error-page/diamond.svg`                  | asset                                   | error-page   | 40 x 40 ring, verbatim path (F§1.5)                                                 |
| `src/assets/illustrations/error-page/dot-columns.svg`              | asset                                   | error-page   | Four vertical columns (10 / 8 / 6 / 4 dots), desktop and tablet                     |
| `src/assets/illustrations/error-page/dot-rows.svg`                 | asset                                   | error-page   | Four horizontal rows (10 / 8 / 6 / 4 dots), mobile                                  |
| `src/components/route-fallback/i18n/{en,uk}.json`                  | catalog (moved)                         | eager (json) | `route_fallback.loading`, values unchanged                                          |
| `src/routes/route-paths.ts`, `src/routes/app-routes.ts`            | data (edited)                           | eager        | Two keys, two route entries                                                         |
| `lighthouse/constants.js`                                          | config (edited)                         | not shipped  | Audits `/forbidden` and `/server-error` beside the three existing pages             |
| `src/styles/colors.ts`                                             | tokens (edited)                         | eager        | New `customColors` entries (section 9.2)                                            |

Deleted: `src/components/not-found/i18n/` (its two keys move as described in D-12).

> Assumption: `ErrorPage` carries no `UI*` prefix. It is a page-level composite, not a reusable
> primitive, like its siblings `ErrorFallback`, `NotFound` and `RouteFallback`.

> Assumption: the two new thin pages get their own folders (`forbidden/`, `server-error/`),
> mirroring `not-found/`, so the three route entries stay symmetrical and the pinned
> `@/components/not-found/not-found` import path does not move.

### 3.3 Boundary and gate fit

- **dependency-cruiser.** `src/components/**` imports only `src/components`, `src/hooks`,
  `src/utils`, `src/routes/route-paths`, `src/styles`, `src/assets`, `src/lib/reliability` and
  `src/providers/mui-theme` (precedent: `src/components/layouts/footer-loader.ts`). Nothing
  imports `src/modules/**` (`no-components-import-modules`) or `@/providers/di`. No file is
  named `*-mapper.ts` or `*-factory.ts`, so `components-no-direct-injectable-import` stays
  silent. Every new module has an importer (`no-orphans`); SVG assets are not modules for it.
- **module-shape.** `config/module-shape.json` constrains only `src/modules/**` and test roots;
  all new folders are lowercase kebab-case.
- **No cycle.** The page never imports anything from `src/components/error-boundary/`;
  `route-error-page.tsx` reaches the page only through a dynamic `import()`.

## 4. The shared `ErrorPage` and the variant table

### 4.1 Types (`src/components/types/error-page/index.ts`, type-only, `import type` only)

```ts
import type { CSSObject } from '@emotion/react';

import type { FallbackLandmark } from '@/components/types/error-boundary';

export type ErrorPageVariantId = 'notFound' | 'forbidden' | 'serverError';
export type ErrorPageHomeAppearance = 'contained' | 'outlined';
export type ErrorPageBreakpoint = 'desktop' | 'tablet' | 'mobile';

export interface ErrorPageVariant {
  glyphs: readonly [string, string, string];
  digitColor: string;
  digitShadowColor: string;
  titleKey: string;
  descriptionKey: string;
  codeKey: string;
  homeAppearance: ErrorPageHomeAppearance;
  requestAccess: boolean;
}

export interface ErrorPageProps {
  variant: ErrorPageVariantId;
  landmark: FallbackLandmark;
}
```

Plus `ErrorPageGeometry` (one record of numbers per breakpoint, section 8.3) with its sub-record
types (`ErrorPageDigitGeometry`, `ErrorPageCardGeometry`, …) and the six style-sheet types
(`ErrorPageStyleSheet`, `ErrorPageCardStyleSheet`, `ErrorPageDigitStyleSheet`,
`ErrorPageIllustrationStyleSheet`, `ErrorPageDotStyleSheet`, `ErrorPageActionStyleSheet`, each
`Record<Token, CSSObject>`), following `ErrorFallbackStyleSheet`. `ErrorPageProps` reuses `FallbackLandmark` so the page accepts the
exact landmark contract `RouteError` already receives.

### 4.2 Variant table (`error-page-variants.ts`)

A data-only literal, `as const satisfies Record<ErrorPageVariantId, ErrorPageVariant>`,
default-exported. It contains no function-valued property, so the issue #100 / #180 selectors
pass (precedent: `src/routes/route-paths.ts`, `src/features/home/styles.ts`).

| Field              | `notFound`                         | `forbidden`                        | `serverError`                         |
| ------------------ | ---------------------------------- | ---------------------------------- | ------------------------------------- |
| `glyphs`           | `['4', '0', '4']`                  | `['4', '0', '3']`                  | `['5', 'x', 'x']`                     |
| `digitColor`       | `paletteColors.primary.main`       | `customColors.brand.darkPrimary`   | `paletteColors.secondary.main`        |
| `digitShadowColor` | `customColors.digitShadow.primary` | `customColors.digitShadow.dark`    | `customColors.digitShadow.secondary`  |
| `titleKey`         | `error_page.not_found.title`       | `error_page.forbidden.title`       | `error_page.server_error.title`       |
| `descriptionKey`   | `error_page.not_found.description` | `error_page.forbidden.description` | `error_page.server_error.description` |
| `codeKey`          | `error_page.not_found.code`        | `error_page.forbidden.code`        | `error_page.server_error.code`        |
| `homeAppearance`   | `contained`                        | `outlined`                         | `contained`                           |
| `requestAccess`    | `false`                            | `true`                             | `false`                               |

The `*Key` property names put every literal under the i18n gate's static resolvability scan
(R§6): a typo in a key fails `make lint-i18n`, not a test run. The table is the only place the
three variants differ, which is what keeps jscpd at 0 clones.

### 4.3 `ErrorPage` (`index.tsx`)

```tsx
export default function ErrorPage({ variant, landmark }: ErrorPageProps): JSX.Element {
  const config = ERROR_PAGE_VARIANTS[variant];
  const { i18n } = useTranslation();
  usePageTitle(config.titleKey);
  const region = landmark === 'region';
  return (
    <>
      <Box
        component={region ? 'section' : 'main'}
        aria-labelledby={region ? ERROR_PAGE_TITLE_ID : undefined}
        lang={i18n.resolvedLanguage ?? 'en'}
        sx={styles.landmark}
      >
        <ErrorPageComposition variant={variant} />
      </Box>
      {region ? null : <UIFooter />}
    </>
  );
}
```

The sketch shows shape only. `aria-labelledby={… : undefined}` needs the issue #136
`exactOptionalPropertyTypes` treatment (a conditional spread or a widened local type, never a
cast). `ERROR_PAGE_TITLE_ID = 'error-page-title'`, `ERROR_PAGE_ACTIONS_ID =
'error-page-actions'` and `ERROR_PAGE_DIGITS_ID = 'error-page-digits'` live in
`error-page-variants.ts` beside the table, so the card, the digits, the page, the E2E specs and
the two a11y exceptions share one spelling.

## 5. `RouteError`: status-aware dispatch

### 5.1 Shape

`RouteError` today runs three hooks, the recovery classification and a `useCallback`; adding a
branch there would break the rules of hooks (a conditional return before `useNavigate`) or push
the function past rust-code-analysis LLOC 10 / exits 3. The split is:

```tsx
export default function RouteError({ landmark }: RouteErrorProps): JSX.Element {
  const variant = errorPageStatusDetector.detect(useRouteError());
  if (variant === null) return <RouteErrorFallback landmark={landmark} />;
  return <RouteErrorPage variant={variant} landmark={landmark} />;
}
```

`RouteErrorFallback` is today's `RouteError` moved verbatim (its `toError`, `reloadPage`,
`focusMainWhenFocusWasLost` helpers and the `ErrorFallback` render keyed by `location.key`). It
calls `useRouteError()` itself, so the dispatcher passes only `landmark`. The composer and the
mapper keep importing `RouteError` from the same path, so `route-composer.tsx` is not edited
and the ADR-drift gate is not triggered.

### 5.2 `ErrorPageStatusDetector` (`error-page-status-detector.ts`)

**Which errors can reach the branch (plan iteration 2).** `AppRouteObject` has no `loader` or
`action` field and `RouteMapper.map()` emits only `element` and `errorElement`, so no route in
this app runs a loader. A page or guard can therefore only throw **during render**, and
react-router's `RenderErrorBoundary.getDerivedStateFromError` stores that value as-is (react-router
7.18.4, `chunk-OB3PAWPO.mjs`): a render-thrown `Response` or `data()` value never becomes a
router error response, and `isRouteErrorResponse` (which needs a boolean `internal` and a `data`
key) rejects it. A detector that read only router-produced responses would make the user
decision UD-2 dead code. The detector therefore reads the status from three shapes, in order:

1. a router error response (`isRouteErrorResponse`), which future loaders and actions produce;
2. a thrown `Response` (`error instanceof Response`, `.status`);
3. a `data()` value: an object whose `type` is `'DataWithResponseInit'` with a numeric
   `init.status` (`data(x, 403)` and `data(x, { status: 403 })` both store `init.status`;
   `data(x)` stores `init: null`).

```ts
class ErrorPageStatusDetector {
  private readonly exact: ReadonlyMap<number, ErrorPageVariantId> = new Map([
    [403, 'forbidden'],
    [404, 'notFound'],
  ]);

  public detect(routeError: unknown): ErrorPageVariantId | null {
    const status = this.statusOf(routeError);
    return status === null ? null : this.byStatus(status);
  }

  private statusOf(error: unknown): number | null {
    if (isRouteErrorResponse(error)) return error.status;
    if (error instanceof Response) return error.status;
    return this.dataStatus(error);
  }

  private dataStatus(error: unknown): number | null {
    if (typeof error !== 'object' || error === null) return null;
    if (!('type' in error) || error.type !== 'DataWithResponseInit') return null;
    return 'init' in error ? this.initStatus(error.init) : null;
  }

  private byStatus(status: number): ErrorPageVariantId | null {
    if (status >= 500 && status <= 599) return 'serverError';
    return this.exact.get(status) ?? null;
  }
}

export default new ErrorPageStatusDetector();
```

The sketch shows shape only; `initStatus(init: unknown)` narrows with `typeof` and `in` (never a
cast) and returns the numeric `status` or `null`. The class stays under the rust-code-analysis
caps (at most three exits per method) and imports only `react-router` and a type.

- `*Detector` is an approved suffix ("classifies or recognizes a condition"), mirroring
  `recoveryStrategyDetector`. `Response` is a browser global inside the ADR-003 matrix and is
  provided in Jest by `tests/jsdom-fetch-environment.cjs`, so the class stays eager-safe.
- It runs **before** `recoveryStrategyDetector`, which is not edited: for every input the
  detector returns `null` for, the existing classification and `ErrorFallback` behaviour are
  byte-for-byte what they are today (other 4xx → navigate-home, plain errors → reset,
  chunk-load → reload, `{ retryable }` → retry or none). A render-thrown `Response` or `data()`
  value with any other status still lands on `reset`, exactly as today.
- Reporting is unchanged for render throws too: react-router's `RenderErrorBoundary`
  `componentDidCatch` forwards render errors to the `RouterProvider` `onError` seam, so
  `routeComposer.routeErrorHandler()` reports them with `surface: 'route'` as it does today.
- **RBAC contract (#114):** a guard either navigates to `ROUTE_PATHS.forbidden` or throws
  `data(null, { status: 403 })` while rendering; both reach the 403 page.
- Mapping matrix (the unit test's table, FR-6 P2 and P3). Router-shaped literals use
  `{ status, statusText: '', internal: false, data: null }` (precedent `buildRouteResponse` in
  `tests/unit/lib/reliability/recovery-strategy-detector.test.ts`). `new Response(null, {
status })` only accepts 200 to 599 (status 600 throws a `RangeError`), so 600 is fed as a
  router literal and as `data(null, 600)` only.

| Input                                                                      | Result        |
| -------------------------------------------------------------------------- | ------------- |
| status 403: router literal, `new Response`, `data(null, 403)`              | `forbidden`   |
| status 404: router literal, `new Response`, `data(null, { status: 404 })`  | `notFound`    |
| status 500, 503, 599: router literal, `new Response`, `data()`             | `serverError` |
| status 399, 400, 401, 405, 499: router literal, `new Response`, `data()`   | `null`        |
| status 600: router literal, `data(null, 600)`                              | `null`        |
| `data(null)` (no status), `{ type: 'DataWithResponseInit', init: {} }`     | `null`        |
| `{ type: 'Other', init: { status: 404 } }`, `{ status: 404 }` (plain)      | `null`        |
| `new Error('boom')`, chunk-load error, `null`, `undefined`, string, number | `null`        |

### 5.3 `RouteErrorPage` (`route-error-page.tsx`)

```tsx
const LazyErrorPage = lazy<ComponentType<ErrorPageProps>>(() =>
  errorPageLoader.load().catch(() => ({ default: ErrorPageUnavailable }))
);

function ErrorPageUnavailable({ landmark }: ErrorPageProps): JSX.Element {
  return <RouteErrorFallback landmark={landmark} />;
}

export default function RouteErrorPage(props: ErrorPageProps): JSX.Element {
  const { key } = useLocation();
  return (
    <Suspense fallback={<RouteFallback />}>
      <LazyErrorPage key={key} {...props} />
    </Suspense>
  );
}
```

- Precedent: `app-layout.tsx`'s `UIFooter = lazy(() => footerLoader.load().catch(…))`.
- **Chunk failure** (FR-6, R13): `ChunkRetryLoader` already retries a chunk-load error once;
  a second failure resolves the lazy component to `ErrorPageUnavailable`, which renders the
  existing recovery screen for the original route error. Never a blank screen, never an
  unhandled rejection. React caches the resolved module, so for the rest of the session status
  errors render `ErrorFallback`; that is the same degradation the footer accepts.
- **Remount on navigation:** `key={location.key}` re-mounts the page, re-runs the focus and the
  title effect, matching `RouteErrorFallback`'s keyed `ErrorFallback`.
- **Reporting is unchanged.** `routeComposer.routeErrorHandler()` still reports every route
  error through `boundaryErrorReporter` with `surface: 'route'` before React renders the
  `errorElement`. Neither component reports, and the page renders no status text, message or
  stack (PRD §6, privacy).

### 5.4 Landmark and footer per mount point

| Mount point (composer)                        | `landmark` | Renders                                                | Footer                         |
| --------------------------------------------- | ---------- | ------------------------------------------------------ | ------------------------------ |
| Root route `errorElement`                     | `main`     | `main` + page                                          | page renders `UIFooter`        |
| `ProtectedRoute` / `AppLayout` `errorElement` | `main`     | `main` + page (layout itself not rendered)             | page renders `UIFooter`        |
| Public mapped page `errorElement`             | `main`     | `main` inside `RootLayout` (no footer)                 | page renders `UIFooter`        |
| Protected mapped page `errorElement`          | `region`   | `section[aria-labelledby]` inside `AppLayout`'s `main` | `AppLayout`'s lazy footer only |

This is FR-16 by construction: the page renders a footer exactly when it owns the `main`
landmark, which is exactly when no layout around it already renders one.

## 6. Lazy loading and the eager entrypoint

### 6.1 What stays eager and what does not

| Eager (static from `src/index.tsx`)                                             | Lazy                                                               |
| ------------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| `route-error.tsx`, `route-error-fallback.tsx` (moved bytes, net 0)              | `error-page` chunk: `ErrorPage` and every file under `error-page/` |
| `route-error-page.tsx`, `error-page-loader.ts`, `error-page-status-detector.ts` | the four SVG components                                            |
| the generic `ThemedChunkLoader` (net about 0)                                   | `UIButton`, `UIFooter`, MUI `Box`, `ui-breakpoints`                |
| new `error_page.*` strings inside `localization.json`, minus `not_found.*`      | `not-found`, `forbidden`, `server-error` page chunks               |

The eager graph gains no `@mui/*` import: `performance-serving.test.ts` ("keeps the MUI theme
engine off the eager path") still finds the single `app-providers.tsx -> @mui/material/styles`
edge, because the walker follows static imports only and `error-page-loader.ts` reaches the
page through `import()`. `mui-theme-shell-loader.ts`, `chunk-retry-loader.ts` and
`RouteFallback` are already eager.

**ESTIMATED eager delta** (no local build; CI's `bundle size / measure and gate` comment is the
measurement): dispatcher, detector, loader and `RouteErrorPage` about 1.2 kB raw / 0.6 kB gzip;
catalog strings about +0.9 kB raw for the new uk and en values against about −0.4 kB for the
removed `not_found.*` values, under 0.4 kB gzip. The eleven tokens added to the eager
`src/styles/colors.ts` (section 9.2) add about 0.3 to 0.4 kB raw. Total well inside the PRD's
2,048 B gzip review allowance (NFR-11) and with no edit to `config/performance-budget.json`.

### 6.2 `ThemedChunkLoader` forwards props (D-6)

`ThemedChunkLoader.load()` today returns a `Themed` component that renders
`createElement(Shell, null, createElement(Content))`, with no props. Route pages need none,
but `RouteErrorPage` must pass `variant` and `landmark`. The change is local and
backwards-compatible:

- `src/components/types/providers/index.ts`: `ComponentModule<TProps extends object =
Record<never, never>> = { default: ComponentType<TProps> }` (or the equivalent default that
  keeps today's `ComponentType` meaning; the implementer picks the form `tsc` and
  `@typescript-eslint` accept without `{}`).
- `ThemedChunkLoader<TProps extends object = …>` takes `ModuleLoader<ComponentModule<TProps>>`
  and returns `Promise<ComponentModule<TProps>>`; `Themed(props: TProps)` renders
  `createElement(Shell, null, createElement(Content, props))`.
- `footer-loader.ts` and `route-mapper.tsx` compile unchanged on the default.
- The edit sits in `src/providers/mui-theme/`, which no ADR-drift trigger names. ADR-018 records
  it as a consequence of ADR-017's loader (section 16).

> Assumption: extending the existing loader beats the alternatives: six prop-less loaders (three
> variants by two landmarks) would duplicate code against jscpd, and having the lazy page call
> `useRouteError()` itself could not recover the `landmark` the composer chose.

### 6.3 `errorPageLoader` (`error-page-loader.ts`)

```ts
const errorPageLoader = new ThemedChunkLoader<ErrorPageProps>(
  new ChunkRetryLoader(
    () => import(/* webpackChunkName: "error-page" */ '@/components/error-page')
  ),
  muiThemeShellLoader
);

export default errorPageLoader;
```

A module-level instance with no free function, exactly like `footer-loader.ts`. A `.tsx`
component may not `new` a class (issue #128 gate), which is why the instance lives in this
`.ts` file.

### 6.4 Chunk map

| Chunk          | Entry                                    | Loaded by                             |
| -------------- | ---------------------------------------- | ------------------------------------- |
| `not-found`    | `@/components/not-found/not-found`       | route mapper (catch-all)              |
| `forbidden`    | `@/components/forbidden/forbidden`       | route mapper (`/forbidden`)           |
| `server-error` | `@/components/server-error/server-error` | route mapper (`/server-error`)        |
| `error-page`   | `@/components/error-page`                | `RouteErrorPage`; shared by the three |
| `mui-theme`    | existing                                 | `ThemedChunkLoader` (unchanged)       |

The three page chunks are tiny; Rspack hoists the shared `ErrorPage` graph into the
`error-page` chunk or a shared async chunk, either of which stays far below the 130,000 B gzip
and 400,000 B raw per-asset budgets (NFR-11).

## 7. SVG asset strategy

### 7.1 Assets

All files under `src/assets/illustrations/error-page/` (new folder beside `src/assets/icons/`),
committed and same-origin (CSP `img-src 'self' data:`). No `figma.com/api/mcp/asset` URL is
referenced anywhere; those expire on 2026-10-08.

| Asset             | `viewBox`           | Content                                                                                                                                                   | Approx. size |
| ----------------- | ------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------ |
| `curve.svg`       | `0 0 643 357`       | One `<path>` of the 243 `M x1 y1 L x2 y2` dash segments from F§1.5, `fill="none"`, `stroke="currentColor"`, `stroke-width="1.5"`, `stroke-linecap="butt"` | about 7 kB   |
| `diamond.svg`     | `0 0 40 40`         | The verbatim ring path from F§1.5, `fill="currentColor"`                                                                                                  | < 0.3 kB     |
| `dot-columns.svg` | `0 0 59.09 161.541` | Four columns of `<circle r="3.36">` at the dot tops of F§1.5 (columns 4 / 6 / 8 / 10 from the left), `fill="currentColor"`                                | about 1.5 kB |
| `dot-rows.svg`    | `0 0 161.541 59.09` | The same circles transposed: rows 10 / 8 / 6 / 4 from the top, each row centred on one vertical axis                                                      | about 1.5 kB |

- Every root carries `viewBox` and `preserveAspectRatio="none"` and **no** `width` or `height`
  attribute (sizes come from CSS only). svgr's default svgo config in `rsbuild.config.ts` keeps
  `preset-default`, whose `removeViewBox` drops a `viewBox` only when matching `width` /
  `height` attributes exist, so a root without them keeps its `viewBox`; no svgo configuration
  change is made (that file is an ADR-drift trigger). One asset then serves the desktop size,
  the tablet x-stretch of 1.0185 and the mobile 0.5599 x 0.5602 scale from CSS width and height
  alone. Strokes scale with the art, which is what the design does (mobile dash about 0.84 px).
  Unit tests mock the SVGs, so the visual baselines and the Story 6.1 review are the only checks
  that the attributes survive the build.
- Colour comes from CSS `color` through `currentColor`, so every colour stays a token in
  `src/styles/colors.ts` and is pinned by the style test; opacity 0.3 on the curve is CSS.
- The pre-outlined 204,356-character Figma curve is **not** shipped (R§8.4). The rebuild is a
  one-off conversion of the dash end-point list into the path above, done by hand or a scratch
  script outside the repository; no generator is committed.
- The yellow tab (a rounded rectangle) and the dot (a 10.34 px circle) are plain CSS boxes, not
  assets.

### 7.2 Import style

`import { ReactComponent as CurveArt } from '@/assets/illustrations/error-page/curve.svg';` and
`<Box component={CurveArt} aria-hidden="true" focusable="false" sx={…} />` (precedent:
`registration-error-view.tsx`'s `Box component={ErrorImage}`; `src/assets/icons/svg.d.ts`
already declares the named export).

> Assumption: inline svgr components beat URL `<img>` imports here. They cost about 10 kB of
> lazy JavaScript, but they add no network request, need no image decode before the visual
> lane's stable-DOM check, and let `currentColor` carry the palette tokens. `svgo` (enabled in
> `pluginSvgr`) must keep `viewBox` and `preserveAspectRatio` (section 7.1); the visual
> baselines and the Fable review catch a stripped attribute, which no unit test can see.

Jest has no SVG transform or `moduleNameMapper` entry (R§8.4), and a raw `.svg` import makes
the lazy page reject, which `RouteErrorPage` silently turns into `ErrorFallback`. So:

- the illustration test, the `ErrorPage` test and the jest-axe test each
  `jest.mock('@/assets/illustrations/error-page/<name>.svg', () => ({ ReactComponent: 'svg' }))`;
- `route-error.router.test.tsx`, which needs the real page (region mode, one `main`, one
  `contentinfo`), mocks all five SVG modules: the four illustration assets and
  `@/assets/icons/logo/vilna-logo.svg` (imported by `UIFooter`);
- the page tests (`not-found`, `forbidden`, `server-error`) and `route-error-page.test.tsx` mock
  `@/components/error-page` with a stub that echoes `variant` and `landmark` and renders an `h1`;
- every test that expects the page asserts its `h1` with `findByRole('heading', { level: 1 })`
  and the `error_page.*` title (or the stub's text), so a silent fallback fails the test.

## 8. Layout and responsive strategy

### 8.1 Breakpoints

| Composition | Media query (from `ui-breakpoints` values)                        | Parity width | Notes                                                     |
| ----------- | ----------------------------------------------------------------- | ------------ | --------------------------------------------------------- |
| desktop     | base styles (no query)                                            | 1440         | Applies above 1024 px                                     |
| tablet      | `@media (max-width: ${lg}px)` → `max-width: 1024px`               | 1024         | Same query string as `UIButton`'s theme and `home` styles |
| mobile      | `breakpointsTheme.breakpoints.down('md')` → `max-width: 767.95px` | 375          | Applies below 768 px                                      |

`ERROR_PAGE_MEDIA` (`error-page-media.ts`) holds the two strings, computed from
`breakpointsTheme.breakpoints` (CRM values xs 320, sm 480, md 768, lg 1024, xl 1440), so no
breakpoint number is typed twice. The app theme's own breakpoints (MUI defaults) are not used.

> Assumption: this refines the PRD §8 switch points (desktop from 1440) to desktop above 1024.
> The three parity widths do not move; laptops at 1280 and 1366 get the desktop composition the
> 1440 frames draw rather than the tablet card sized for a 1024 portrait tablet; and the tablet
> query is the exact `max-width: 1024px` string `UIButton` already emits, so the button overrides
> in section 10.2 line up with it.

### 8.2 Composition model

- **Origin O:** the card's left edge and the digit frame's top, as in appendix A.
- `ErrorPageComposition` is `position: relative; isolation: isolate`, width 614 / 474 /
  350.348 px, with `display: flex; flex-direction: column; align-items: center`. In flow:
  the digit frame (466 x 330 desktop and tablet, 344.435 x 243.913 mobile), then the card.
  The digit frame is centred over the card at every size (74 + 233 = 307 = 614 / 2;
  4 + 233 = 237 = 474 / 2; 2.956 + 172.22 = 175.17 = 350.348 / 2), so flex centring reproduces
  the drawn x offsets.
- **Out of flow, absolutely positioned against O**, in paint order through `z-index`: tab 1,
  curve 2, digits 3 (in flow, `position: relative`), card 4 (in flow, `position: relative`),
  diamond, dot and dot columns or rows 5.
- The card grows downward with its content (longer copy, enlarged text, 1.4.12 spacing);
  the tab stays hidden behind it and the desktop columns are anchored to the card top, which is
  fixed by the digit frame height. On mobile the dot rows anchor to the composition bottom
  (`bottom: 0`, centred), and the composition reserves `padding-bottom: 78.87px`
  (19.78 gap + 59.09 rows, read from the rows' `absoluteBoundingBox`), so the rows follow a
  taller card.
- **Mobile below 375 px** (FR-14): the composition is `width: 350.348px; max-width:
calc(100% - 24.6px)`; the card shrinks and wraps, the digit frame keeps its width and
  overflows both sides symmetrically (unsafe flex centring), and the visible glyph run
  (27.7 → 314.9, 287 px) still fits a 320 px viewport.
- **Tab placement:** the yellow tab is positioned by `left` and `right` insets from the card
  edges (desktop 37 / 37, tablet 26 / 27, mobile 19.216 / 19.958) with no fixed width. At the
  three parity widths this reproduces the drawn widths exactly (540, 421, 311.174), and below
  375 px the tab narrows with the card instead of protruding past its right edge (a fixed
  311.174 px tab would reach 330.39 px inside a 295.4 px composition at 320 px).
- **Text inset (plan iteration 2):** the title and the description are centred and shrink to
  their text, capped at `max-width: calc(100% - 2 × textInset)` with `textInset` 24 px on
  desktop and tablet and 16 px on mobile (`ERROR_PAGE_GEOMETRY.<bp>.card.textInset`). Wrapped
  text therefore never runs closer than the inset to the card border, at 320 px, at 375 px with
  the longer uk 403 and 5xx copy, with en copy, and under WCAG 1.4.12 spacing. At the parity
  widths no 404 run reaches the cap (desktop title 236 of 564 px, tablet 236 of 424, mobile 144
  of 316.87), so no parity element moves. Figma's fixed-width description boxes (354 / 261.652
  px) are not used as caps: the 403 desktop description is a 399 px hug box, so a 354 px cap
  would wrap a line the frame draws on one line.
- **Actions row:** not inset. It spans the card content box, so the uk 403 tablet row (449 of
  472 px) stays on one line; it wraps only below its own width, and every single button is
  narrower than the card at every width down to 320 px.
- **Clipping:** the landmark box sets `overflow-x: clip` (Baseline 2022: Safari 16, inside the
  ADR-003 floor) so overflowing decoration never causes horizontal page scroll and, unlike
  `hidden`, creates no scroll container.

### 8.3 Geometry table (`error-page-geometry.ts`)

One data-only record per breakpoint, typed `Record<ErrorPageBreakpoint, ErrorPageGeometry>`,
with appendix A's values **verbatim** (px numbers, no rounding). Style builders read it; nothing
else hard-codes a Figma number.

Sub-records that are identical on desktop and tablet are declared **once** as module-level
`const`s and referenced from both breakpoints: `LARGE_DIGITS` (466 x 330 frame, 244.5 / 293.4,
shadow 4, glyphs x 0 / 147 / 301 at y 0 / 36 / 0), `LARGE_PAGE` (76 / 121) and
`LARGE_CARD_SURFACE` (border 1, radius 16, shadow 4 / 31, text inset 24). Writing them out
twice is a 71-token jscpd clone (measured on 2026-10-01 against `.jscpd.json`, threshold 0, `minTokens` 70); a
prettier-formatted spike with the shared `const`s reports 0 clones. The values stay verbatim;
only their spelling is shared. Fields:

| Group       | Fields (desktop / tablet / mobile values in PRD A.1 / A.2 / A.3)                                                                                                                                                                                                                        |
| ----------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| page        | `paddingTop` 76 / 76 / 43.61; `paddingBottom` 121 / 121 / 73.91                                                                                                                                                                                                                         |
| composition | `width` 614 / 474 / 350.348; `paddingBottom` 0 / 0 / 78.87                                                                                                                                                                                                                              |
| digits      | frame `width`, `height`; `fontSize` 244.5 / 244.5 / 154.462; `lineHeight` 293.4 / 293.4 / 185.355; `shadowOffset` 4 / 4 / 2.527; `glyphs` [{x, y}] x3: desktop and tablet (0, 0) (147, 36) (301, 0); mobile (27.739, 14.582) (120.606, 37.324) (217.896, 14.582)                        |
| card        | `width`; `height` (reference only); `border` 1 / 1 / 0.739; `radius` 16 / 16 / 11.826; `shadowY`, `shadowBlur` 4 31 / 4 31 / 2.957 22.913; rhythm (`top`, `titleLine`, `gapTitle`, `descLine`, `gapActions`, `actionsHeight`, `bottom`); `textInset` 24 / 24 / 16; no description width |
| button      | `height` 62 / 70 / 50; `paddingX` 32 / 44 / 24; `labelSize`, `labelLine`, `labelWeight`                                                                                                                                                                                                 |
| tab         | `left` 37 / 26 / 19.216, `right` 37 / 27 / 19.958 (insets from the card edges), `y`, `height`, `radius` 32 / 32 / 23.652; `width` is derived, never stored                                                                                                                              |
| curve       | `x`, `y`, `width`, `height`                                                                                                                                                                                                                                                             |
| diamond     | `x`, `y`, `width`, `height`                                                                                                                                                                                                                                                             |
| dot         | `x`, `y`, `width`, `height` of the circle from Figma `absoluteRenderBounds` (desktop, also 403 and 5xx: 10.338 x 10.354 at centre 574.921, 99.928; tablet 10.529 x 10.354 at centre 558.255, 99.928); mobile `null` (not rendered)                                                      |
| dotColumns  | `x`, `y`, `width`, `height` (desktop −80, 376, 59.09, 161.541; tablet −79.211, 376, 60.181, 161.541); mobile `null`                                                                                                                                                                     |
| dotRows     | mobile only: `width` 161.541, `height` 59.091, `gapBelowCard` 19.779; desktop and tablet `null`                                                                                                                                                                                         |

**Derived CSS rules** (computed in the builders, documented here so the Fable reviewer can map
them back):

- The card border is `INSIDE` in Figma and children are measured from the outer edge, so
  `padding-top = top − border` and `padding-bottom = bottom − border` with
  `box-sizing: border-box`: desktop 28 / 31, tablet 23 / 39, mobile 25.737 / 25.741. The card
  heights then sum to 222, 235 and 173.696.
- Glyph spans are `position: absolute` at the table's `x` and `y` with `line-height` set, so the
  36 px (22.742 px mobile, tops 14.582 / 37.324 / 14.582) middle drop and the 6 px overlap are
  exact; on desktop and tablet the
  glyph run is left-aligned in its frame (F§6.12), never centred.
- The dot is drawn as a CSS circle placed by its centre, taken from the rotated node's
  `absoluteRenderBounds` (O(574.921, 99.928) on the desktop frames, O(558.255, 99.928) on the
  tablet frame). A rotated node's `x` / `y` is its transform origin and is never read: plan
  iteration 3 corrected an 11.8 / 10.2 px dot error and a 6.74 px mobile dot-row error that
  came from it. Every rotated node (the dot, the mobile rows) is read with `absoluteBoundingBox`
  or `absoluteRenderBounds`.
- Every non-null fragment of a token that is `null` at another breakpoint declares `display`
  (section 14.1).
- Title and description: `max-width: calc(100% - 48px)` on desktop and tablet and
  `calc(100% - 32px)` on mobile (2 × `textInset`), centred by the card's flex column.

> Assumption: the mobile dot rows are centred on the card axis (computed left 94.40) instead of
> the drawn 94.695; the 0.3 px difference is inside NFR-1's ±1.5 px mobile tolerance and keeps
> the rows centred when the card narrows below 375 px.

### 8.4 Digits as decoration (DOM text under a scoped exception)

`ErrorPageDigits` renders one `Box id={ERROR_PAGE_DIGITS_ID}` (`#error-page-digits`) with
`aria-hidden="true"` holding three `<span>` elements whose **text** is the glyph (`4`, `0`, `4`;
`4`, `0`, `3`; `5`, `x`, `x`), with `color` and `text-shadow: 0 <offset>px 0 <shadow>` from the
variant. No CSS generated content is used.

The digits fail WCAG 1.4.3 for large text against the `#FBFBFB` page: 404 `#1EAEFF` is 2.37:1
and 5xx `#FFC01E` is 1.58:1, both under the 3:1 floor (403 `#1B2327` passes). They are the
page's largest visible identifier, and the 403 code and the `5xx` class appear nowhere else (the
titles are "В доступі відмовлено" and "Помилка сервера"), so they are not treated as pure
decoration that may leave the scan. Measured on 2026-10-01 in `node_modules/axe-core/axe.js`:
`color-contrast` runs with `excludeHidden: false` and evaluates text inside `aria-hidden`
subtrees, so the route lane sees the digits. Following the repository rule (fix at the source,
or add a scoped entry with its tracking issue, never route around the scan), the palette is
design-owned and tracked in #276, so the digits carry **one scoped `A11Y_EXCEPTIONS` entry**
(section 10.4).

The `aria-hidden` box keeps the three glyph spans out of the accessibility tree (read glyph by
glyph they make poor speech), and the code they show is given once as text instead:
`ErrorPageCard` renders a visually hidden `p` right after the `h1` with
`error_page.<variant>.code` ("Код помилки: 403", en "Error code: 403"; "5xx" on the
server-error page). It is absolutely positioned and clipped, so it changes no pixel, no flex
rhythm and no baseline, and WCAG 1.3.1 holds on the 403 and 5xx pages, whose titles do not name
the code. The 404 page gets the same line for uniformity although its title already names the
code; one unconditional element keeps the card free of a variant branch. The style is the card
sheet's breakpoint-independent `statusCode` token (the `UILiveStatus` visually-hidden object;
`UILiveStatus` itself is not reused because it carries `role="status"`).

- jsdom tests read the glyph text directly; jest-axe disables `color-contrast` (no layout), so
  the exception binds only the browser lane.
- Lighthouse does not read `A11Y_EXCEPTIONS`. Its `color-contrast` audit already fails on
  `/forbidden` and `/server-error` because of the white-on-`#1EAEFF` primary action, and an
  audit fails once whatever the node count, so the DOM-text digits add no failing audit and no
  score change.

## 9. Typography and colour tokens

### 9.1 Typography map

All text pins `fontFamily: 'Golos, sans-serif'` (the app theme's stack; `UIButton`'s theme says
`'Golos, Inter'`). Every weight below is already declared in `src/styles/fonts.css`
(Golos 400, 500, 600, 700), so no font file is added. Text sizes and line heights are `rem`
(16 px root) so user font-size settings scale them (WCAG 1.4.4); geometry is `px`. Letter
spacing is 0 everywhere and `text-transform` is `none` on the buttons.

| Element      | Figma token            | Desktop                  | Tablet                   | Mobile                     | Colour                       |
| ------------ | ---------------------- | ------------------------ | ------------------------ | -------------------------- | ---------------------------- |
| Title `h1`   | H3 / 22 bold           | 600, 2.25rem / 2.6875rem | as desktop               | 700, 1.375rem / 1.625rem   | `customColors.text.heading`  |
| Description  | Body text 16/18/mobile | 400, 1rem / 1.625rem     | 400, 1.125rem / 1.875rem | 400, 0.9375rem / 1.5625rem | `customColors.text.dark`     |
| Button label | Button / 15 medium     | 600, 1.125rem / 1.375rem | as desktop               | 500, 0.9375rem / 1.125rem  | white or `brand.darkPrimary` |
| Digits       | (Golos Text Bold)      | 700, 244.5px / 293.4px   | as desktop               | 700, 154.462px / 185.355px | per variant                  |

Digits stay `px`: they are fixed-geometry decoration whose box the composition is built around.

### 9.2 Colour map and new tokens

Existing tokens reused: `paletteColors.primary.main` `#1EAEFF`, `paletteColors.primary.hover`
`#00A3FF`, `paletteColors.secondary.main` `#FFC01E`, `paletteColors.border.default` `#EAECEE`,
`paletteColors.background.default` `#FFFFFF`, `paletteColors.background.subtle` `#E1E7EA`,
`paletteColors.grey[50]` `#969B9D`, `customColors.text.dark` `#1A1C1E`.

Added to `customColors` in `src/styles/colors.ts` (the `CustomColors` type and the MUI
augmentation follow `typeof customColors` automatically; the file sits in a `styles/`
directory, outside the coverage and mutation scopes, and the style tests pin the values where
they are used):

| Token                                | Value                    | Figma source                                |
| ------------------------------------ | ------------------------ | ------------------------------------------- |
| `customColors.surface.page`          | `#FBFBFB`                | "Grey bg" frame fill                        |
| `customColors.text.heading`          | `#000000`                | card title fill (not a file variable)       |
| `customColors.brand.darkPrimary`     | `#1B2327`                | "Dark primary" (403 digits, outlined label) |
| `customColors.digitShadow.primary`   | `#0E87CC`                | 404 digit drop shadow                       |
| `customColors.digitShadow.dark`      | `#999999`                | 403 digit drop shadow                       |
| `customColors.digitShadow.secondary` | `#CC9300`                | 5xx digit drop shadow                       |
| `customColors.decorative.curve`      | `#00A3FF`                | dashed curve (= `primary.hover`)            |
| `customColors.decorative.diamond`    | `#01A6FF`                | diamond                                     |
| `customColors.decorative.dot`        | `#0B315E`                | dot                                         |
| `customColors.decorative.dotGrid`    | `#E1E7EA`                | dot columns and rows ("Brand gray")         |
| `customColors.shadow.card`           | `rgba(55, 64, 78, 0.07)` | card drop shadow `#37404E` at 7 %           |

> Assumption: the decoration colours that are not Figma variables (`#01A6FF`, `#0B315E`,
> `#000000`) still become named tokens rather than literals in style code, so the palette stays
> single-sourced and the Fable reviewer can trace each hex to one place.

## 10. Actions and the inert request-access button

### 10.1 Markup

| Variant                   | First action                                                          | Second action                                             |
| ------------------------- | --------------------------------------------------------------------- | --------------------------------------------------------- |
| `notFound`, `serverError` | `UIButton to={ROUTE_PATHS.home} variant="contained"` → `<a href="/">` | none                                                      |
| `forbidden`               | `UIButton to={ROUTE_PATHS.home} variant="outlined"` → `<a href="/">`  | `UIButton variant="contained"` → `<button type="button">` |

Both sit in `Box id="error-page-actions"` (flex row, gap 8 px, centred, `flex-wrap: wrap` so
the 401 px row can wrap below 401 px of card content width). Labels are plain text children,
never `UITypography`, so the existing back-to-main exception selector
(`a[href="/"].MuiButton-root > span.MuiTypography-root`) cannot match and silently exempt the
new home link (R§8.2). The home action is a full-document anchor, as today's 404 page and
`ErrorFallback` are; it is the only safe navigation out of a crashed route tree.

### 10.2 Button styling (`action-styles.ts`)

`UIButton` keeps its own theme (contained `#1EAEFF`, radius 57, hover `#00A3FF`, active
`#0399ED`, focus-visible `2px solid #404142` offset 2). `ErrorPageActionStyles` adds `sx`:

- **Shared base** (one private builder, then two overrides, as `ErrorFallbackStyles.action()`
  does, so jscpd sees no clone): `textTransform: 'none'`, `letterSpacing: 0`, Golos, label
  size and line height per breakpoint, `borderRadius: '57px'`, `minHeight` = button height,
  `boxShadow: 'none'`.
- **Contained:** padding `20px 32px` desktop, `24px 44px` tablet (Figma fixed height 70 with the
  label at y 24), `16px 24px` mobile. `minHeight` instead of `height` so 1.4.12 spacing grows
  the button rather than clipping it.
- **Outlined:** white fill, `1px solid` `grey[50]`, label `brand.darkPrimary`; padding minus the
  border (`19px 31px` / `23px 43px` / `15px 23px`); hover keeps the same colours (no hover
  design); `'&:focus-visible': { outline: '2px solid <text.dark>', outlineOffset: '2px' }`
  (17:1 against white, WCAG 2.4.7 and 1.4.11), because the `UIButton` theme gives `outlined`
  no focus style.
- **Theme media queries re-pinned:** the `UIButton` theme changes `outlined` padding at
  `max-width: 1024px` and `max-width: 375px` and adds `marginBottom: 8px` at 375. The builder
  repeats its own padding under both of those exact query strings and sets `marginBottom: 0`,
  following the `src/features/home/styles.ts` sign-out precedent.
- **Focus-ring inset (accessibility lead):** the row is `width: 100%` with `padding-inline: 4px`
  and every button is capped at `max-width: 100%`, so a button's border box sits at least 4 px
  inside the card box and its 2 px + 2 px offset ring is never clipped by the card, at 320 px
  and under WCAG 1.4.12 spacing (asserted by Story 3.3).
- **Reduced motion (accessibility lead):** under `prefers-reduced-motion: reduce` the shared base
  sets `transition: none` and hides the `MuiTouchRipple-root` layer; both buttons also set
  `disableFocusRipple`, so focus is shown by the outline alone.

### 10.3 "Запросити доступ" stays inert and accessible

- A real `<button type="button">` (UIButton's default `type` when no `to`/`href` is given) with
  `aria-disabled="true"` and never the `disabled` attribute, so it stays focusable and in the tab
  order, with the visible localized label as its accessible name (WCAG 2.5.3). MUI adds no
  styling for `aria-disabled`, so it stays pixel-identical to the design. No `onClick`, no
  `href`, no form, no navigation, no request, no analytics.
  Activation by click, Enter or Space changes nothing; the E2E spec proves it with the console
  fixture and an unchanged URL, `h1` and request log.
- **The TODO is tracked without a code comment** (product owner decision UD-4, user preference
  "no added code comments"):
  1. this architecture (section 20) and the PRD (section 13) record it;
  2. the epics artifact carries it as an explicit out-of-scope follow-up on the 403 story;
  3. the PR body lists it under "Follow-ups" with a link to RBAC #114;
  4. the unit and E2E tests name the behaviour ("renders the request-access button without
     an action"), so the inert state is asserted, not accidental.
- Because the button has no handler it produces no mutants; its presence, `type`, name and
  order are asserted.

> Decision (accessibility lead, 2026-10-01; supersedes the earlier enabled-button assumption):
> the button carries `aria-disabled="true"` so assistive technology announces it as unavailable
> while it keeps the design's active primary look and its tab stop; it is flagged in the PR as a
> known gap until #114 supplies the flow. Both error-page buttons set `disableFocusRipple`.

### 10.4 Contrast exceptions (NFR-8)

Two entries are appended to `A11Y_EXCEPTIONS` in `tests/utils/a11y/axe-config.ts`. The first
covers the primary actions:

```ts
{
  ruleId: 'color-contrast',
  selector: '#error-page-actions > .MuiButton-contained',
  reason:
    'Error-page primary action: white on Figma primary #1EAEFF is 2.46:1; token owned by design.',
  trackingUrl: PALETTE_CONTRAST_ISSUE,
},
```

The `id` scope matches only the error pages' primary actions (404 and 5xx home, 403 request
access) and never the outlined home link, which passes (15.95:1). It satisfies
`a11y-gate.test.tsx` (four fields, no wildcard, selector longer than 3, reason longer than 20)
and follows the auth submit-button precedent. The outlined `#969B9D` border (2.81:1) is not an
axe finding; it is flagged in the PR as a 1.4.11 design note.

The second covers the decorative digits (section 8.4):

```ts
{
  ruleId: 'color-contrast',
  selector: '#error-page-digits > span',
  reason:
    'Error-page status digits: #1EAEFF / #FFC01E on #FBFBFB are 2.37:1 / 1.58:1; design-owned.',
  trackingUrl: PALETTE_CONTRAST_ISSUE,
},
```

It matches only the three glyph spans of the digit box (the 403 `#1B2327` digits pass and are
never reported), carries all four fields and no wildcard, and is listed in
`docs/accessibility/acceptance-standard.md` "Current exceptions" with the first one (six
entries in all, all tracked by #276).

## 11. Routes, manifest and browser-lane inclusion

### 11.1 `src/routes/route-paths.ts`

```ts
forbidden: '/forbidden',
serverError: '/server-error',
```

Inserted before `notFound`; existing keys and values unchanged; no comment added.

### 11.2 `src/routes/app-routes.ts`

Two entries before the catch-all, same shape as the existing `notFound` entry (array-nested
object literals, so the issue #180 selector does not fire on `load`):

```ts
{
  path: ROUTE_PATHS.forbidden,
  guard: 'public',
  load: () => import(/* webpackChunkName: "forbidden" */ '@/components/forbidden/forbidden'),
},
{
  path: ROUTE_PATHS.serverError,
  guard: 'public',
  load: () =>
    import(/* webpackChunkName: "server-error" */ '@/components/server-error/server-error'),
},
```

The mapper wraps them like every public page: `ThemedChunkLoader` + `ChunkRetryLoader` +
`ReloadingChunkLoader` keyed by path, `errorElement: <RouteError landmark="main" />`. No `meta`
is added (`RouteMeta.titleKey` is not consumed by the composer; the page sets its own title).
`registry.ts`, `route-composer.tsx`, `routes.tsx` and `route-validator.ts` are untouched.

> Assumption: RBAC PR #230 currently adds `accessDenied: '/access-denied'` to the same file.
> The product owner fixed `/forbidden` for #309; whichever PR merges second rebases onto
> `ROUTE_PATHS.forbidden` as the single denial target (risk RK-9). This architecture does not
> add an alias.

### 11.3 Route-coverage manifest (`tests/e2e/route-coverage.tsv`)

| route         | suite  | spec                                                   | details (abridged)                                               |
| ------------- | ------ | ------------------------------------------------------ | ---------------------------------------------------------------- |
| `forbidden`   | e2e    | `tests/e2e/modules/error-pages.spec.ts`                | Renders /forbidden, follows home, proves request access is inert |
| `forbidden`   | visual | `tests/visual/visual-comparison.error-pages.spec.ts`   | 1440 x 940 and 1024 x 1366 screenshots of /forbidden             |
| `forbidden`   | e2e    | `tests/e2e/a11y/routes.a11y.spec.ts`                   | axe scan, WCAG 2.1 AA                                            |
| `forbidden`   | e2e    | `tests/e2e/a11y/error-pages-keyboard.a11y.spec.ts`     | Keyboard-only tab order through both actions and the footer      |
| `forbidden`   | e2e    | `tests/e2e/a11y/error-pages-text-spacing.a11y.spec.ts` | WCAG 1.4.12 text spacing keeps the card content unclipped        |
| `serverError` | e2e    | `tests/e2e/modules/error-pages.spec.ts`                | Renders /server-error and follows home                           |
| `serverError` | visual | `tests/visual/visual-comparison.error-pages.spec.ts`   | 1440 x 940 screenshots of /server-error                          |
| `serverError` | e2e    | `tests/e2e/a11y/routes.a11y.spec.ts`                   | axe scan, WCAG 2.1 AA                                            |

The existing `notFound` rows keep their specs (rewritten in place). No `allowlisted` row is
added: both routes are registered by `app-routes.ts`, which the gate checks.

### 11.4 Lane inclusion

| Lane                         | Inclusion                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Playwright a11y route scan   | `routeScans` gains `{ key: 'forbidden', path: ROUTE_PATHS.forbidden, ready: 'main h1' }` and the `serverError` twin (public, no `seedAuth`); `openRoute` already waits for `contentinfo`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| Playwright keyboard contract | New `error-pages-keyboard.a11y.spec.ts`: `expectTabOrder` on /forbidden (home, request access, then footer links), every stop `visibleFocus: true` (precedent `home-keyboard.a11y.spec.ts`); a single-stop `visibleFocus: true` check of the contained home link on the catch-all and `/server-error`; Enter on home navigates; the `h1` focused and inside the viewport at 839 x 412                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| Visual (desktop engines)     | `notFoundScreens` becomes 1440 x 1000 `desktop`, 1024 x 1366 `tablet`, 375 x 1082 `mobile`; new spec for 403 and 5xx at 1440 x 940 plus 403 at 1024 x 1366 (regression only, no frame) with distinct screen names (`forbidden-desktop`, `forbidden-tablet`, `server-error-desktop`); `PAGES.FORBIDDEN`, `PAGES.SERVER_ERROR` added                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| Visual mobile device lane    | Not added (PRD out of scope); 375 px width is covered by the desktop-engine `mobile` screen                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| Lighthouse                   | Added: `lighthouse/constants.js` `pages` gains `/forbidden` and `/server-error` (same `normalizedBaseUrl` expansion); `tests/unit/tooling/lighthouse-constants.test.ts` pins the five URLs; the existing `lighthouserc` assertions apply unchanged: desktop performance, accessibility and best practices 0.95 and SEO 0.90; mobile performance 0.84 (`median-run`) and accessibility, best practices and SEO 0.90; plus the resource budgets. A green job proves those assertions only. The profile's stricter `quality.lighthouse_mobile` 85 is checked by reading the two error routes' mobile category scores in the LHCI report and recording them in the PR body. The acceptance standard (`docs/accessibility/acceptance-standard.md`) asks this of user-facing routes; `notFound` has no stable URL, which is why it never was |
| memlab                       | Unchanged; `/__memlab_away__` now renders the new 404, so the page must hold no listener or timer past unmount (the title hook already cleans up)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| Storybook                    | Not added (section 15.7)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |

## 12. Page titles, focus and landmarks

- **Titles** (FR-10): `ErrorPage` calls `usePageTitle(config.titleKey)`, so the catch-all reads
  "Помилка 404 - VilnaCRM", `/forbidden` "В доступі відмовлено - VilnaCRM", `/server-error`
  "Помилка сервера - VilnaCRM", in en "Error 404 - VilnaCRM" and so on. The hook re-applies on
  `languageChanged` and resets to "VilnaCRM" on unmount, also when `RouteError` renders the
  page.
- **Focus** (FR-11): the `h1` is `Box component="h1" id="error-page-title" tabIndex={-1}
ref={useFocusOnMount<HTMLHeadingElement>()}` (`UITypography` does not forward refs, so the
  `h1` is an MUI `Box`, which does). Focus lands on the `h1` on every mount, including the keyed
  remount after navigation, and `UIErrorBoundary`'s recovery query
  (`main[tabindex="-1"], h1[tabindex="-1"]`) still finds a target.
- **No ring on the `h1`** (decision): the `h1` is a programmatic focus target only
  (`tabIndex={-1}`, never in the Tab sequence, not an operable control), so WCAG 2.4.7 asks no
  indicator of it, and its style token carries `'&:focus': { outline: 'none' }`. A
  `:not(:focus-visible)` guard would not work: Chromium matches `:focus-visible` on script focus
  when no pointer interaction preceded it (measured 2026-10-01 in headless Chromium 149 on an
  `h1 tabindex="-1"` focused at load), which is exactly how every visual and E2E spec reaches
  the page (`page.goto`), so the baselines and the Fable comparison would carry a 2 px outline
  the frames do not draw. The `:focus-visible` rings stay on both buttons (section 10.2). The
  card style test pins the rule, and the keyboard a11y spec asserts that right after
  `page.goto` the `h1` is focused with computed `outline-style: none` in chromium, firefox and
  webkit.
- **Landmarks:** `main` with `lang`, or a `section` named by the `h1` under `AppLayout`
  (section 5.4); exactly one `h1`; no positive `tabindex`; the description is plain text, never
  `role="alert"` or a live region; the digits and every decoration are `aria-hidden`, and the
  code is exposed once by the visually hidden `error_page.<variant>.code` line (section 8.4).
- **Short viewports** (decision): the shared `useFocusOnMount` focuses without
  `preventScroll`, so on a short viewport (a landscape phone, 839 x 412) the browser scrolls the
  `h1` (430 px below the content top in the tablet composition) into view and the page opens
  scrolled with the digits partly above the fold. This is accepted rather than adding a
  page-local focus hook: the `h1`, the description and the actions are the content the user
  needs, every other page shares the hook, and a new hook would add a dependency-array mutant
  that needs an equivalence annotation. The keyboard spec pins that at 839 x 412 the `h1` is
  focused and fully inside the viewport; the PR flags it for design and the Fable reviewer.
- **Tab order:** home action → request access (403) → footer links, from DOM order alone.
- **Touch targets:** buttons are 62 / 70 / 50 px tall, above the 44 px floor at every size.

## 13. i18n

Catalog `src/components/error-page/i18n/{uk,en}.json`, namespace `error_page`, the single owner
of every key below. No existing key is re-declared (`buttons.back_to_main`,
`error_boundary.go_home` keep their owners; only the en value "Go to homepage" is reused).

| Key                                   | uk                                                 | en                                                             |
| ------------------------------------- | -------------------------------------------------- | -------------------------------------------------------------- |
| `error_page.not_found.title`          | Помилка 404                                        | Error 404                                                      |
| `error_page.not_found.description`    | Сторінки не існує                                  | This page does not exist                                       |
| `error_page.forbidden.title`          | В доступі відмовлено                               | Access denied                                                  |
| `error_page.forbidden.description`    | На жаль, у вас немає прав доступу до цієї сторінки | Unfortunately, you do not have permission to access this page  |
| `error_page.server_error.title`       | Помилка сервера                                    | Server error                                                   |
| `error_page.server_error.description` | Сервер тимчасово недоступний. Спробуйте пізніше.   | The server is temporarily unavailable. Please try again later. |
| `error_page.not_found.code`           | Код помилки: 404                                   | Error code: 404                                                |
| `error_page.forbidden.code`           | Код помилки: 403                                   | Error code: 403                                                |
| `error_page.server_error.code`        | Код помилки: 5xx                                   | Error code: 5xx                                                |
| `error_page.actions.home`             | На головну                                         | Go to homepage                                                 |
| `error_page.actions.request_access`   | Запросити доступ                                   | Request access                                                 |

- `not_found.title`, `not_found.description` and `not_found.cta` are deleted with
  `src/components/not-found/i18n/`; their only consumers (the old page, its unit test, the E2E
  spec) are rewritten.
- `route_fallback.loading` moves, values unchanged, to `src/components/route-fallback/i18n/`,
  the folder of its only consumer. The merged `localization.json` keeps the identical key, so
  `RouteFallback` and its tests do not change.
- `make i18n-generate` regenerates `src/i18n/localization.json`; `make lint-i18n` then proves
  parity, single ownership and that every `t()` and `*Key` literal resolves in both locales.
- Digits are literal glyphs from the variant table and are never translated.

> Assumption: the uk 403 body ships the correct orthography "На жаль" (design: "Нажаль"), and the
> 5xx copy is the product owner's replacement for the design placeholder; both are flagged for
> design in the PR (PRD FR-20).

## 14. Code-shape compliance

| Rule                                  | How the design meets it                                                                                                                                                                                                                                                                                         |
| ------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| No free functions / statics (#100)    | `.ts` logic is a class with instance methods exported as a singleton (`ErrorPageStatusDetector`, the seven `*Styles`); `error-page-loader.ts` exports an instance; the other `.ts` files are data-only literals                                                                                                 |
| No object-literal methods (#180)      | Variant, geometry and media tables hold strings, numbers, arrays and nested data only                                                                                                                                                                                                                           |
| Class naming (#129)                   | `ErrorPageStatusDetector` (`*Detector`); `ErrorPageStyles`, `ErrorPageResponsiveStyles`, `ErrorPageCardStyles`, `ErrorPageDigitStyles`, `ErrorPageIllustrationStyles`, `ErrorPageDotStyles`, `ErrorPageActionStyles` (`*Styles`); no new suffix, so `config/class-naming-policy.js` is untouched                |
| Type-only files (#88)                 | Every `interface` / `type` lives in `src/components/types/error-page/index.ts` or the edited `types/providers`; components and `.ts` logic import them with `import type`                                                                                                                                       |
| Component DI gate (#128)              | No `.tsx` file uses `new`; the loader instance is created in a `.ts` file                                                                                                                                                                                                                                       |
| No `data-testid` (#90)                | Tests query by role, name, text, landmark; specs reach the digits and actions by the stable `id`s the a11y exceptions share                                                                                                                                                                                     |
| Suspense fallback (#116)              | The only new `Suspense` uses `fallback={<RouteFallback />}`                                                                                                                                                                                                                                                     |
| Router shape (#116)                   | New routes are data in `app-routes.ts`; no router built outside `routes.tsx`                                                                                                                                                                                                                                    |
| rust-code-analysis                    | One component per file; `RouteError` split in two; styles split by area (section 14.1): each private fragment method reads **one** breakpoint's geometry, `build()` composes three fragments per token through `ErrorPageResponsiveStyles.compose`, no closures, at most four tokens and five methods per class |
| jscpd (threshold 0, 70 tokens)        | Variants are data; the three page entries are under 70 tokens each; the two button styles share one base builder; style fragments are parameterized by one breakpoint's geometry instead of copied blocks; identical desktop/tablet geometry sub-records are declared once (section 8.3)                        |
| Explicit types / member accessibility | Every function and method declares a return type (`: JSX.Element`, `: CSSObject`); class members are `public` / `private`                                                                                                                                                                                       |
| sonarjs `jsx-no-leaked-render`        | Conditionals use `cond ? <X /> : null`                                                                                                                                                                                                                                                                          |
| No suppression of any kind            | No disable directive, no ignore entry, no Stryker annotation is planned; no added code comments                                                                                                                                                                                                                 |

### 14.1 Style layout under the rust-code-analysis caps (spike-measured)

A first draft had three style classes whose methods each built one token from geometry for all
three breakpoints. That shape fails `config/metrics-policy.json`: a review measured `card()`
reading desktop, tablet and mobile at Halstead volume 1685.6 and even a minimal `tab()` at
1099.2, over `halstead_volume_function_max` 1000; splitting every token into per-breakpoint
helpers instead pushes `ErrorPageStyles` (build plus seven breakpoint-dependent tokens) past
`nom_functions_file_max` 10. The chosen split:

| File                     | Class                         | Tokens (`build()` keys)                      | Methods                                                                 |
| ------------------------ | ----------------------------- | -------------------------------------------- | ----------------------------------------------------------------------- |
| `responsive-styles.ts`   | `ErrorPageResponsiveStyles`   | -                                            | `compose(desktop, tablet, mobile)`                                      |
| `error-page-styles.ts`   | `ErrorPageStyles`             | `landmark`, `composition`                    | `build`, 2 fragments                                                    |
| `card-styles.ts`         | `ErrorPageCardStyles`         | `card`, `title`, `description`, `statusCode` | `build`, 3 fragments (`statusCode` is a breakpoint-independent literal) |
| `digit-styles.ts`        | `ErrorPageDigitStyles`        | `digits`, `glyphs`                           | `build`, 2 fragments                                                    |
| `illustration-styles.ts` | `ErrorPageIllustrationStyles` | `tab`, `curve`, `diamond`                    | `build`, 3 fragments                                                    |
| `dot-styles.ts`          | `ErrorPageDotStyles`          | `dot`, `dotColumns`, `dotRows`               | `build`, 3 fragments                                                    |
| `action-styles.ts`       | `ErrorPageActionStyles`       | `row`, `contained`, `outlined`               | `build`, private `base`, 3 fragments                                    |

- A fragment method has the signature `private card(geometry: ErrorPageGeometry): CSSObject`
  (`glyphs` builds the three `:nth-of-type` positions of one breakpoint); it never reads
  `ERROR_PAGE_GEOMETRY` itself. `build()` destructures the three breakpoint records once and
  calls `responsiveStyles.compose(this.card(desktop), this.card(tablet), this.card(mobile))`
  per token. `compose` returns `{ ...desktop, [ERROR_PAGE_MEDIA.tablet]: tablet,
[ERROR_PAGE_MEDIA.mobile]: mobile }`. No closure is passed anywhere, so
  `nom_closures_file_max` 6 is untouched.
- A `null` geometry block (mobile `dot`, `dotColumns`; desktop and tablet `dotRows`) makes the
  fragment return `{ display: 'none' }`. Media blocks only add declarations on top of the base
  (desktop) style, so every **non-null** fragment of such a token declares `display`
  explicitly: the mobile `dotRows` fragment sets `display: 'block'`, without which the base
  `display: none` would hide the rows below 768 px, and the desktop and tablet `dot` and
  `dotColumns` fragments set `display: 'block'` too, for symmetry. `dot-styles.test.ts` pins
  each `display` value in its `toEqual`, so a mutant that drops the reset is killed.
- **Spike, measured 2026-10-01** with `bin/rust-code-analysis-cli -m -O json` on scratch
  `card-styles.ts`, `illustration-styles.ts` and `responsive-styles.ts` written to this layout:
  `card()` 501, `tab()` 300 (with insets), `curve()` 266, `diamond()` 241, `title()` 250,
  `description()` 265, `build()` 449 (three tokens), `compose()` 125 Halstead volume; file
  volumes 2222 / 1894 / 229 (cap 8000); 4 functions per file; MI (Visual Studio) 36 and above;
  cyclomatic 1 per method. Every hard limit passes with room for the fourth token
  `ErrorPageActionStyles` carries.
- Each story that adds a style file runs `make lint-metrics` before it is done (NFR-18).

## 15. Test plan per layer

All tests run in CI; locally only focused Jest on the changed tests, ESLint, Prettier, `tsc`,
`make lint-i18n`, `make i18n-generate`, `make check-e2e-route-coverage` and the cheap Docker
linters (NFR-22).

### 15.1 Unit (Jest, jsdom), one direct test per new `src` file

| Test file (`tests/unit/…`)                                                                                      | Covers                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| --------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `components/error-page/error-page.test.tsx`                                                                     | `main` vs `section[aria-labelledby]`, `lang`, footer only in `main` mode (`contentinfo` count), `usePageTitle` key per variant, one `h1`, no `role="alert"`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| `components/error-page/components/error-page-composition.test.tsx`                                              | Renders illustration, digits and card in order for each variant                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| `components/error-page/components/error-page-illustration.test.tsx`                                             | Layer is `aria-hidden`, svgs `focusable="false"`, four art elements plus tab and dot                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| `components/error-page/components/error-page-digits.test.tsx`                                                   | `#error-page-digits` with three spans whose text is 4/0/4, 4/0/3, 5/x/x inside the `aria-hidden` box; no digit is exposed by role                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| `components/error-page/components/error-page-card.test.tsx`                                                     | `h1#error-page-title` focused after mount, uk strings, en after `changeLanguage`, uk 403 contains "На жаль," not "Нажаль"; the visually hidden code line "Код помилки: 404 / 403 / 5xx" (en "Error code: …") follows the `h1` once per variant                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| `components/error-page/components/error-page-actions.test.tsx`                                                  | Contained vs outlined home `a[href="/"]`; 403 order home then `button[type="button"]` "Запросити доступ"; clicking it changes nothing; 404 / 5xx have no `button`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| `components/error-page/config/error-page-variants.test.ts`                                                      | Isolated load (`tests/unit/utils/isolated-module.ts`), `toEqual` the full literal table                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `components/error-page/config/error-page-geometry.test.ts`                                                      | Isolated load, `toEqual` appendix A per breakpoint                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| `components/error-page/config/error-page-media.test.ts`                                                         | Isolated load, exact query strings                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| `components/error-page/styles/{responsive,error-page,card,digit,illustration,dot,action}-styles.test.ts`        | Isolated load (precedent `error-boundary.styles.test.ts`), `toEqual` every token of `build()` across the three media blocks; the card test pins the `h1` `'&:focus': { outline: 'none' }` rule and the title and description `maxWidth` per breakpoint                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| `components/not-found/not-found.test.tsx`, `forbidden/forbidden.test.tsx`, `server-error/server-error.test.tsx` | Mock `@/components/error-page`; assert `variant` and `landmark="main"`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| `components/error-boundary/error-page-status-detector.test.ts`                                                  | The section 5.2 matrix over all three input shapes, every boundary (kills `EqualityOperator` and `ConditionalExpression` mutants)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| `components/error-boundary/error-page-loader.test.ts`                                                           | Resolves a themed component that forwards `variant` and `landmark` (mocked page and shell)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| `components/error-boundary/route-error-page.test.tsx`                                                           | `@/components/error-page` mocked with a stub that echoes `variant` / `landmark` in an `h1`; `RouteFallback` while pending; stub after `findByRole('heading', { level: 1 })`; rejected loader renders `ErrorFallback` for the original error; remount on `location.key`. The module-level `lazy` caches its first resolution, so the success and rejected-loader cases each load the module fresh (`jest.isolateModulesAsync` or `jest.resetModules()` + `import()`)                                                                                                                                                                                                                                                            |
| `components/error-boundary/route-error.test.tsx` (rewritten)                                                    | Dispatcher: status → `RouteErrorPage` props; `null` → `RouteErrorFallback`; the two old cases "404 → navigate-home" and "503 → retry" rewritten to the new behaviour                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| `components/error-boundary/route-error-fallback.test.tsx`                                                       | The existing `RouteError` cases moved over (navigate-home for 401, retry for `{ retryable }`, reset, region vs main, remount)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| `components/error-boundary/route-error.router.test.tsx`                                                         | Real page with the five SVG modules mocked (section 7.2); `createMemoryRouter` with **page components that throw during render** (the only throw path today's route contract has) `data(null, { status })` and `new Response(null, { status })` for 400, 401, 403, 404, 499, 500 and 599, `data(null, 600)`, and a plain `Error`; the same statuses thrown from loaders (router-converted responses, for future loaders); each status page asserted by its `error_page.*` `h1` via `findByRole`; under a stand-in `AppLayout`: `region`, one `main`, one `contentinfo`; the existing `onRouteError` seam still receives a 404 with `surface: 'route'` while the 404 page renders; `onCaughtError` passed and asserted per test |
| `providers/mui-theme/themed-chunk-loader.test.tsx`                                                              | Existing cases plus: props reach the content inside the shell                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| `routes/route-paths.test.ts`, `routes/registry.test.ts`, `routes/routes.test.tsx`                               | New keys and values; both routes public in `app.shell`; `/forbidden` and `/server-error` render their page modules (mocked)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| `routes/route-composer.test.tsx`                                                                                | "keeps public routes directly under RootLayout" expects `[ROUTE_PATHS.forbidden, ROUTE_PATHS.serverError, ROUTE_PATHS.notFound, ROUTE_PATHS.signUp, ROUTE_PATHS.signIn]`; the open-route landmark case still reports `main` for both new routes                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| `tooling/lighthouse-constants.test.ts`                                                                          | `pages` equals the five expanded URLs, the two error routes last                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| `app.test.tsx`, `app-root.test.tsx`, `app.router-wiring.test.tsx`                                               | Add mocks for the two new page module paths where those files mock every page                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| `tooling/performance-serving.test.ts`                                                                           | Pin the `forbidden` and `server-error` `webpackChunkName` imports; keep the `not-found` pin; assert `error-page-loader.ts` imports `@/components/error-page` dynamically with `webpackChunkName: "error-page"`; the eager-MUI walk is unchanged                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |

Console gate: every lazy render is awaited with `findBy…`; tests that throw through a route
pass `onCaughtError` and assert it; no file-wide spy (NFR-19).

### 15.2 Integration

No new suite file, and no React, router or page module enters the integration suite. The
integration run applies the global 100 % thresholds to every `src` file it loads
(`jest.config.ts` `collectCoverageFrom: src/**`, roots `tests/integration`), and rendering a
404 through the router would load `route-error.tsx`, the fallback, `route-error-page.tsx`, the
composer, the mapper, every contract and the whole error-page graph without running most of it,
turning `integration testing / integration` red.

`tests/integration/services/security-events/security-event-chain.integration.test.ts` (a
service-only suite today) gains one case at the service seam it already covers: report
`new Error('404 Not Found')`, the error `routeComposer.toError` builds from a 404 route
response, through `boundaryErrorReporter` (`@/services/error-reporting/boundary-error-reporter`,
which imports only the two cores the suite already loads) with `{ surface: 'route' }`, and
assert the `error_boundary_catch` security event with surface `route` and the observability
capture. "The page renders while reporting happens" is proved in the unit
`route-error.router.test.tsx` (section 15.1).

### 15.3 jest-axe (component lane)

`tests/unit/a11y/ui-components.a11y.test.tsx` replaces the old `<NotFound />` case with
`ErrorPage` in all three variants (`main`) plus `forbidden` in `region` mode, SVGs mocked. 0
violations (contrast is owned by the browser lane).

### 15.4 E2E (Playwright, `@tests/e2e/utils/fixtures`)

- `tests/e2e/modules/not-found.spec.ts` (rewritten): `/definitely-not-a-route` and a deep path
  show `main h1` = `t('error_page.not_found.title')`, exactly one `main a[href="/"]` named
  `t('error_page.actions.home')`, the `h1` is focused, the title reads "… - VilnaCRM"; click home
  lands on `/` (then the existing auth redirect).
- `tests/e2e/modules/error-pages.spec.ts` (new): `/forbidden` without and with a seeded token
  (no redirect); both actions in order; request access by click, Enter and Space leaves URL,
  `h1` and request log unchanged; `/server-error` has no `button`; clicking home on
  `/forbidden` and on `/server-error` lands on `/` or its auth redirect; reload keeps the page.
  Layout checks, each on the catch-all, `/forbidden` and `/server-error`, in uk (every browser
  lane runs against a uk build: `src/i18n.js` fixes `lng` from the build-time
  `REACT_APP_MAIN_LANGUAGE` and has no detector or switcher, so en layout is checked in the
  section 18 en pass, not here):
  - 320 x 640: `scrollWidth` equals the viewport width; each glyph span of
    `#error-page-digits` and the card's box lie within x 0 to 320 (`overflow-x: clip` hides
    overflow from `scrollWidth`, so visibility is asserted separately); the uk 403 and 5xx
    descriptions wrap inside a taller card, keep at least 16 px from each card edge, and the
    actions lie inside the card; the yellow tab's box lies within the card's left and right
    edges (the tab is reached from `main h1` → card → composition → illustration layer → first
    child, by DOM order, since `src` ships no test ids);
  - 375 x 812: the uk 403 and 5xx descriptions keep at least 16 px from each card edge;
  - 1024 x 1366 (403, uk): the two actions share one top and lie inside the card, and the
    description keeps at least 24 px from each card edge;
  - 1440 x 600: the footer top is at or below the lowest decoration's bottom plus 121 px and
    `scrollWidth` is unchanged (FR-15 E1);
  - 1440 x 1400: the footer's bottom edge is at the viewport bottom ± 1 px (FR-15 E2);
  - 1920 x 1080: the card is 614 px wide and centred at 960 ± 1 px (FR-12 E1).

### 15.5 Accessibility (Playwright)

`routes.a11y.spec.ts` scans the two new routes in chromium, firefox and webkit; the new
keyboard spec runs `expectTabOrder` on `/forbidden` with `visibleFocus: true` on every stop
(the outlined home link, "Запросити доступ" and both footer links), as
`docs/accessibility/acceptance-standard.md` requires for static focus styles and as
`home-keyboard.a11y.spec.ts` does, so the computed style must change on focus and a page with
no drawn ring fails; it checks the contained home link the same way with a single-stop
`expectTabOrder` on the catch-all and `/server-error`. It also asserts that right after
`page.goto` on each of the three pages the `h1` is focused with `outline-style: none`
(section 12), and that at 839 x 412 the focused `h1` lies fully inside the viewport (the
short-viewport decision in section 12). Expected
result: 0 violations outside the two new scoped entries (section 10.4).

`tests/e2e/a11y/error-pages-text-spacing.a11y.spec.ts` (new) injects the WCAG 1.4.12 override
stylesheet (`line-height: 1.5 !important; letter-spacing: 0.12em !important; word-spacing:
0.16em !important` on every element and `margin-bottom: 2em !important` on paragraphs) on
`/forbidden` at 1440 x 940, 1024 x 1366 and 375 x 812 (uk) and asserts that the `h1`, the
description and both actions lie inside the card's box (nothing clipped by its
`overflow: hidden`); the actions row may wrap. This is the NFR-7 1.4.12 test.

### 15.6 Visual

- `tests/visual/visual-comparison.not-found.spec.ts`: 404 at 1440 x 1000, 1024 x 1366 and
  375 x 1082 (`notFoundScreens` redefined). The six old baselines are deleted and nine new ones
  are generated.
- `tests/visual/visual-comparison.error-pages.spec.ts` (new): 403 and 5xx at 1440 x 940 and
  403 at 1024 x 1366 (`forbidden-tablet`, a regression baseline without a parity claim).
- Baselines come only from the pinned Playwright container against a freshly recreated
  `make start-prod` stack, or from the CI visual job's artifact; never from a reused container
  (`--no-recreate`) and never from the host. `toHaveScreenshot` keeps the repository defaults
  (NFR-5).

### 15.7 Storybook

No story is added. `.storybook/main.ts` registers no svgr loader, so the named
`ReactComponent` imports the illustration and `UIFooter` rely on resolve to `undefined` there;
making them work means a Storybook build change outside #309's scope. The PRD already lists
stories as optional.

> Assumption: a Storybook story for `ErrorPage` is a follow-up that first adds svgr to the
> Storybook webpack config; `storybook testing / storybook-build` stays green because no story
> imports the new files.

### 15.8 Mutation

Every new file above is in `scripts/ci/mutation-scope.mjs`'s scope (file-level `styles.ts` and
the data tables included; `src/styles/colors.ts` and `types/` are not). The direct tests and the
isolated loads are what kill the static-literal mutants; no `Stryker disable` annotation is
planned. If a hook dependency array mutant appears in a new component, prefer removing the
hook over annotating it.

## 16. Documentation and ADR

### 16.1 ADR decision

The docs-policy drift gate does **not** fire: no edit touches `.dependency-cruiser.js`,
`rsbuild.config.ts`, `config/browser-support.json`, `src/config/**`, `src/routes/registry.ts`,
`src/routes/route-composer.tsx` or the `package.json` `dependencies` map. An ADR is still
required by PRD FR-18, because the change alters an approved reliability decision: a 5xx route
response loses ADR-007's in-place **Try again**.

> Assumption: a new **ADR-018** is written rather than editing ADR-007's decision text, so the
> approved record stays intact; ADR-007 gains only one line under "Links" pointing to ADR-018.
> The number is free on `main` and in every open PR checked on 2026-10-01 (#230, #284, #297,
> #308). Status is `Approved` on merge, following the ADR-016 and ADR-017 precedent where the
> maintainer's PR approval is the decision.

### 16.2 ADR-018 outline (`docs/adr/018-route-error-status-pages.md`)

```markdown
# ADR-018: Route error responses with a known status render the designed error pages

- Status: Approved
- Deciders: [@kravalg](https://github.com/kravalg)
- Date: 2026-10-01

**Technical Story**: [#309](https://github.com/VilnaCRM-Org/crm/issues/309) implements the
Figma 404, 403 and 5xx pages and asks `RouteError` to render them for matching route error
responses.

## Context and Problem Statement

ADR-007 routes every route error through recoveryStrategyDetector and ErrorFallback: a 4xx
response shows "This page is not available" with a home link, a 5xx shows Try again. The design
now has dedicated 404, 403 and 5xx pages, RBAC (#114) needs a denial target, and RouteError is
on the eager path, where MUI and illustrations may not go (ADR-017).

## Decision Drivers

- Product owner decision: 403, 404 and 5xx route responses render the designed pages; every
  other error keeps ErrorFallback.
- Eager entrypoint stays MUI-free (performance-serving pin, ADR-017).
- No change to the RecoverableError contract or to the bootstrap path.
- One footer, one main landmark, focus on the h1.

## Considered Options

- A: a status dispatcher in front of the recovery model, lazy themed page (chosen)
- B: a new `status-page` recovery strategy inside recoveryStrategyDetector and ErrorFallback
- C: navigate to /forbidden or /server-error from the errorElement

## Decision Outcome

Option A. ErrorPageStatusDetector maps 403, 404 and 500-599, read from a router error response,
a render-thrown Response or a data() value, to a page variant before the recovery model runs
(the route contract has no loaders, so a render throw is the reachable path); RouteErrorPage
lazy-loads the page through ThemedChunkLoader, now generic over props; a chunk failure falls back to ErrorFallback. Reporting through routeErrorHandler
is unchanged.

## Positive Consequences

- Designed pages for status errors; RBAC gets /forbidden and can throw
  data(null, { status: 403 }) from a guard.
- Eager growth limited to a detector, a loader and catalog strings.
- ADR-007's contract, detector and ErrorFallback are untouched for every other error.

## Negative Consequences

- A 5xx route response no longer offers an in-place Try again; the user goes home or reloads.
- ThemedChunkLoader gains a props type parameter (ADR-017 surface).
- After a failed error-page chunk, status errors fall back to ErrorFallback for the session.

## Pros and Cons of the Options

### Option A

#### Good (Option A)

- ADR-007's contract, detector and ErrorFallback stay untouched for every other error.
- The eager path gains only a detector and a loader.

#### Bad (Option A)

- Two classification points (status first, recovery second).
- ThemedChunkLoader gains a props type parameter.

### Option B

#### Good (Option B)

- A single classification point.

#### Bad (Option B)

- Widens RecoverableError and its guard allowlists.
- Pulls page UI into the eager ErrorFallback, or forces it lazy for every error.
- Rewrites ADR-007's contract.

### Option C

#### Good (Option C)

- One rendering path for the status pages.

#### Bad (Option C)

- Loses the failing URL and adds a history entry.
- Flashes, and loops if the target route itself errors.

## Links

- ADR-007, ADR-009, ADR-017; issue #309; PR for #309; RBAC #114; contrast #276
```

The README row is added under the index list; `make lint-adr` validates sections, metadata and
the index. The outline is a content guide in the template's exact shape (`#### Good (Option X)`
/ `#### Bad (Option X)` headings with bullet bodies), not text to paste unchecked.

### 16.3 Documentation sync

| File                                                                                                               | Change                                                                                                                                                                                                                                                                                                                                        |
| ------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `docs/adr/018-route-error-status-pages.md`, `docs/adr/README.md`, `docs/adr/007-reliability-model.md` (Links line) | Section 16.2                                                                                                                                                                                                                                                                                                                                  |
| `src/routes/README.md`                                                                                             | `app-routes.ts` row "home + 404" → "home, 404, 403, 5xx"; "Errors and fallbacks" mentions the status branch                                                                                                                                                                                                                                   |
| `CLAUDE.md`, `AGENTS.md`, `.github/copilot-instructions.md`                                                        | Pattern 14 gains the status-dispatch sentence; the Route Registry sentence "routes (home + 404) live in `src/routes/app-routes.ts`" (CLAUDE.md:2373) → "home, 404, 403 and 5xx"; the Localization example path `src/components/not-found/i18n/` → `src/components/error-page/i18n/`; the a11y section's "four `color-contrast` entries" → six |
| `docs/accessibility/acceptance-standard.md`                                                                        | "Current exceptions" count (six) and the two new entries; both Lighthouse sentences (lines 25-26 and 31-33, which name `/`, `/sign-in` and `/sign-up`) list `/`, `/sign-in`, `/sign-up`, `/forbidden` and `/server-error`                                                                                                                     |
| `docs/ui-toolkit.md`                                                                                               | R8 row "layouts, not-found" also names `error-page` as local (no toolkit counterpart)                                                                                                                                                                                                                                                         |

All edits keep `make lint-docs` (links, anchors, command references) and markdownlint MD013
green; no new `make` target is referenced.

## 17. CI checks (names verified against `.github/workflows/` on 2026-10-01)

The PRD's NFR-21 used shorthand names; the exact `<workflow> / <job>` strings are:

| PRD shorthand                       | Exact check                                                         |
| ----------------------------------- | ------------------------------------------------------------------- |
| `static testing / static`           | `static testing / static`                                           |
| `unit testing / unit`               | `unit testing / unit`                                               |
| `integration testing / integration` | `integration testing / integration`                                 |
| `mutation testing`                  | `mutation testing / merge and enforce gate` (16 shards before it)   |
| `e2e testing / test`                | `e2e testing / test`                                                |
| `visual tests / test`               | `visual tests / visual-test`                                        |
| `accessibility testing / a11y-unit` | `accessibility testing / axe component gate`                        |
| `accessibility testing / a11y-e2e`  | `accessibility testing / axe route scans and keyboard contract`     |
| `bundle size / measure and gate`    | `bundle size / measure and gate`                                    |
| `performance testing`               | `performance testing / lighthouse desktop`, `… / lighthouse mobile` |
| `memory leak`                       | `memory leak testing / memory-leak-testing`                         |
| `gate ratchet`                      | `gate ratchet / no binding threshold weakened`                      |

## 18. Fable pixel-verification hand-off (FR-19)

The reviewer receives: appendix A, `error-page-geometry.ts` (the same numbers as code), the
derived rules of section 8.3, and these intended deviations so they are not reported as
defects: centred composition at every width (tablet card included), 76 / 43.61 px top offsets,
footer gaps of at least 121 / 73.91 px, the 403 diamond and dot at the 404 / 5xx relative
placement, "На жаль", the 5xx copy, no header or sidebar, mobile dot rows centred on the card
axis, the tab placed by insets, the `h1` without a focus outline (section 12), rem-based text
at the default 16 px root, the 24 / 16 px text inset, the page opening scrolled on a short
landscape viewport (section 12). Ink widths are compared only for the
runs appendix A.4 gives a Figma reference; runs marked n/a there are covered by NFR-1 line
boxes and the NFR-4 raster crop. The reviewer also runs an **en layout pass** on `make start`
with `REACT_APP_MAIN_LANGUAGE=en` in the local, untracked `.env` (dev server restarted, value
restored afterwards; no source change): the en 403 actions row on one line inside the card at
1024 x 1366, the en 403 and 5xx descriptions inside the text inset at 1024, 375 and 320, and no
horizontal scroll at 320. en has no frame, so these are layout checks without a parity claim.
At 375 the report also confirms every glyph span and the card lie within x 0 to 375. The method
is PRD §10.1 (chromium, DPR 1, fonts loaded, stable DOM,
`getBoundingClientRect` against O, ink width by DOM `Range`, computed styles, `pixelmatch` crops
as a backing signal). The Figma exports use `get_screenshot` with `maxDimension` equal to the
frame's longer edge and a dimension check (NFR-4), and the planned deviations are painted out
with the NFR-4 per-frame masks (5xx title and description, 403 description and the misplaced
Figma diamond and dot plus their rendered positions, mobile crop clipped to the frame) instead
of being argued in prose. Content-area defects are fixed and the visual baselines regenerated
after the last fix; footer deviations become follow-up issues.

## 19. Risks

| ID    | Risk                                                                                         | Likelihood / impact | Mitigation                                                                                                    |
| ----- | -------------------------------------------------------------------------------------------- | ------------------- | ------------------------------------------------------------------------------------------------------------- |
| RK-1  | MUI or page code reaches the eager graph through `RouteError`                                | medium / high       | Page only via `import()` in `error-page-loader.ts`; performance-serving walk; bundle comment ≤ 2,048 B gzip   |
| RK-2  | Generic `ThemedChunkLoader` breaks `route-mapper` or `footer-loader` typing                  | low / medium        | Default type parameter keeps today's meaning; `tsc` and both loader tests                                     |
| RK-3  | White-on-primary labels and the decorative digits fail the route axe lane                    | certain / medium    | Two scoped entries (`#error-page-actions > .MuiButton-contained`, `#error-page-digits > span`), #276, PR flag |
| RK-4  | A guard throws a status value the detector does not read                                     | low / medium        | Detector reads router responses, thrown `Response` and `data()`; render-throw router tests (section 5.2)      |
| RK-5  | 5xx route responses lose the in-place retry                                                  | certain / low       | ADR-018, PR flag; other errors keep ADR-007 behaviour                                                         |
| RK-6  | `UIButton` theme media queries override the error-page padding at 1024 and 375               | medium / medium     | Re-pin under the exact theme query strings (home precedent); visual baselines at both widths                  |
| RK-7  | `svgo` strips `viewBox` or `preserveAspectRatio`, distorting the tablet and mobile art       | low / medium        | Roots carry no `width` / `height`, so `removeViewBox` keeps the `viewBox`; visual baselines and Fable review  |
| RK-8  | Curve rebuild drifts from the Figma dashes                                                   | medium / low        | Built from the 243 measured end-point pairs, not an estimated dash array; Fable raster crop (NFR-4)           |
| RK-9  | RBAC PR #230 adds `accessDenied: '/access-denied'` to `route-paths.ts`                       | certain / low       | Merge-order conflict only; the second PR rebases onto `ROUTE_PATHS.forbidden` (section 11.2)                  |
| RK-10 | Visual baselines regenerated from stale code                                                 | medium / high       | Pinned container on a recreated stack, or the CI artifact only                                                |
| RK-11 | Fable flags intended deviations                                                              | medium / low        | Section 18 hand-off list                                                                                      |
| RK-12 | Mutation survivors on style and data literals credited to the wrong test                     | medium / medium     | Direct, isolated-load tests per file (section 15.1, 15.8)                                                     |
| RK-13 | rust-code-analysis caps on the style builders                                                | medium / low        | Six area classes, one breakpoint per fragment method, spike-measured (section 14.1); `make lint-metrics`      |
| RK-14 | An error-page chunk failure leaves status errors on `ErrorFallback` for the session          | low / low           | Accepted (footer precedent); documented in ADR-018                                                            |
| RK-15 | Firefox Cyrillic hinting differs with `lang` on the landmark (known #132 effect)             | medium / low        | Baselines are regenerated for all three engines anyway; `lang` stays on the landmark only, never on `<html>`  |
| RK-16 | memlab away page (the 404) leaks or grows                                                    | low / medium        | No timers or listeners beyond the title hook, which cleans up; `memory leak testing` in CI                    |
| RK-17 | Moving `route_fallback.loading` breaks a consumer                                            | low / low           | Same key and values in the merged catalog; `make lint-i18n`; `RouteFallback` tests unchanged                  |
| RK-18 | Duplicate `id`s if two error pages ever render at once                                       | low / low           | Only one `errorElement` renders per match; the ids are constants used by the a11y entry                       |
| RK-19 | `/forbidden` or `/server-error` misses a `lighthouserc` assertion or the profile's mobile 85 | medium / medium     | Lazy chunks, no network images; if a floor is missed it goes to the product owner as a question in the PR     |
| RK-20 | A focus ring on the programmatically focused `h1` enters every baseline                      | certain / medium    | `'&:focus': { outline: 'none' }` on the `h1` only; three-engine E2E assertion (section 12)                    |

## 20. TODOs, follow-ups and next step

- **TODO (tracked here, in the PRD and in the PR body; never as a code comment):** wire
  "Запросити доступ" to an access-request flow once RBAC #114 provides one.
- **Design confirmation (PR):** 5xx copy, "На жаль", white on `#1EAEFF`, the `#969B9D` outlined
  border, the centred tablet card, the desktop switch above 1024 px, the decorative digits under the
  second scoped exception (2.37:1, 1.58:1), the 24 / 16 px text inset, missing hover, focus
  and pressed designs.
- **Follow-up issues:** the app shell (header, sidebar); 403 and 5xx tablet and mobile frames;
  Storybook svgr support and an `ErrorPage` story; any footer deviation the Fable review
  finds.
- **Next step:** hand this architecture to the PM / SM for `create-epics-stories`. Suggested
  story order: (1) tokens, types, geometry, variants, media, i18n move; (2) `ErrorPage`
  components, styles and assets; (3) the three pages, route keys and contract entries;
  (4) `ThemedChunkLoader` generic, detector, loader, `RouteErrorPage`, dispatcher split;
  (5) E2E, a11y, visual specs, the manifest and the Lighthouse URLs; (6) ADR-018 and doc sync; (7) Fable
  verification and baseline regeneration. Stories 1 → 2 → 3 are sequential; 4 depends on 2;
  5 depends on 3 and 4; 6 is independent; 7 is last.

## 21. Amendment: post-load warm-up of the error pages (added after implementation)

Product-owner request on draft PR #311: a user on a slow or unreliable connection must still get
the designed page when a route errors, so the page is fetched before it is needed.

- **What is warmed.** The `error-page` chunk group (`ErrorPage`, its card, digits, actions,
  inlined svgr illustration and the statically imported `UIFooter`) and the four Golos weights
  the page renders (400, 500, 600, 700). The `mui-theme` shell is already warmed at boot and the
  `error_page.*` strings are in the eager `localization.json`, so neither needs a request.
- **One chunk.** The `*`, `/forbidden` and `/server-error` route loaders in
  `src/routes/app-routes.ts` use `webpackChunkName: "error-page"`, the name `errorPageLoader`
  already uses, so one request warms `RouteError` and all three routes. Once rspack has installed
  the chunk, every later `import()` of a module in it resolves from the module registry with no
  request, whichever `ChunkRetryLoader` instance asks.
- **When.** `PostLoadPrefetcher` (`src/lib/reliability/post-load-prefetcher.ts`) is attached once
  from `src/index.tsx`, after `root.render`, in the success branch only. It waits for the window
  `load` event (or schedules at once when `document.readyState` is already `complete`), then
  2 000 ms, then loads every target in parallel. Offline at that moment, it waits for the next
  `online` event and the same delay. `requestIdleCallback` and `navigator.connection.saveData`
  fail `compat/compat` against the Safari 16.4 floor, so the timing is a fixed delay.
- **Failure.** Each target's rejection is swallowed with no log, so nothing reaches the e2e
  `pageerror` gate or the Jest console gate. `FontFaceLoader.load` is `async`, so a font source
  that throws synchronously surfaces as that swallowed rejection rather than as an uncaught
  error in the timer callback. `ChunkRetryLoader` forgets a failed promise, so the
  later render retries normally. The warm-up targets `errorPageLoader`, never a
  `ReloadingChunkLoader`, so it can never reload the page.
- **New code.** `PostLoadPrefetcher` and `FontFaceLoader` in `src/lib/reliability/`, the
  `PrefetchHost` and `FontFaceSource` types in `src/lib/reliability/types/`, and
  `ERROR_PAGE_FONT_FACES` in `src/components/error-page/config/error-page-fonts.ts`. `Prefetcher` joins
  the approved class-name suffixes in `config/class-naming-policy.js` and the CLAUDE.md table.
- **Tests.** Direct unit tests for both classes and the font list (fake timers for the delay,
  idempotence, the `{ once: true }` listeners, the offline re-arm, a rejected target, and a
  `ChunkRetryLoader` that is not poisoned by a failed warm-up); a `RouteErrorPage` test that
  renders from the already-settled loader; `performance-serving.test.ts` pins the shared chunk
  name and the entry wiring; `tests/e2e/modules/error-pages-offline.spec.ts` waits for the
  warm-up on `/sign-in`, goes offline, navigates client-side to each error route and asserts
  the designed page, every Golos weight loaded and no failed request. The wait is the shared
  `tests/e2e/utils/error-page-warm-up.ts` helper (chunk response, `document.fonts.ready`, no
  request in flight), and `offline-notice.spec.ts` navigates through it too, so its
  `setOffline(true)` can never cut the warm-up request mid-flight — Firefox reports an aborted
  script load as a console error, which the e2e guard rejects.
- **Budgets.** Worst case on an audited URL, if Lighthouse captures the warm-up: about 8 KB gzip
  of script and up to two unused Golos weights (about 46 KB), inside every
  `resource-summary` budget; the eager entrypoint grows by the two small classes only. No budget
  is edited.
- **Out of scope.** A full document load of an error route while offline still needs the
  network; only a service worker could answer it (follow-up issue, own ADR). The warm-up narrows
  but does not close the window in which `React.lazy` caches the `ErrorFallback` after a
  double chunk failure, and an offline client-side navigation to an unwarmed public route still
  reaches `ReloadingChunkLoader`.
