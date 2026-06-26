---
status: 'complete'
workflowType: 'prd'
project_name: 'crm'
date: '2026-06-26'
issue: 'https://github.com/VilnaCRM-Org/crm/issues/104'
inputDocuments:
  - 'https://github.com/VilnaCRM-Org/crm/issues/104'
  - 'src/index.tsx'
  - 'src/app.tsx'
  - 'src/button-example.tsx'
  - 'src/i18n.js'
  - 'src/config/i18n-config.js'
  - 'src/config/tokens.ts'
  - 'src/config/dependency-injection-config.ts'
  - 'src/services/error/error-handler.ts'
  - 'src/styles/theme.ts'
  - 'src/styles/colors.ts'
  - 'src/providers/.gitignore'
  - 'src/routes/.gitignore'
  - 'src/modules/user/features/auth/components/auth-error-boundary/index.tsx'
  - 'src/modules/user/features/auth/types/auth-error-boundary/index.ts'
  - 'src/modules/user/features/auth/components/auth-page-layout/index.tsx'
  - 'src/modules/user/features/auth/components/protected-route/index.tsx'
  - 'src/modules/user/features/auth/routes/sign-up/index.tsx'
  - 'src/modules/user/features/auth/routes/sign-in/index.tsx'
  - 'src/modules/user/features/auth/stores/index.ts'
  - 'src/modules/user/features/auth/hooks/use-page-title.ts'
  - 'src/components/ui-back-to-main/index.ts'
  - 'src/components/ui-footer/index.ts'
  - 'src/i18n/localization.json'
  - 'scripts/localization-generator.js'
  - '.dependency-cruiser.js'
  - 'eslint.config.mjs'
  - 'config/metrics-policy.json'
  - '.jscpd.json'
  - 'lighthouse/constants.js'
  - 'lighthouse/lighthouserc.mobile.js'
  - 'jest.config.ts'
  - 'tests/unit/app.test.tsx'
  - 'tests/unit/utils/render-with-providers.tsx'
---

# PRD - Refactor App Shell into an Enterprise Product Shell (Issue #104)

**Author:** John (Product Manager) **Date:** 2026-06-26 **Source:** VilnaCRM-Org/crm#104

## Executive Summary

The application shell is demo-scale. Provider composition is a hand-written JSX pyramid in
`src/index.tsx:22-33`, the router is a literal inline array in `src/app.tsx:13-31` with **no**
`errorElement`, **no** catch-all `*`/404 route, and **no** layout route (the only `<Outlet/>` is the
auth-feature `ProtectedRoute`), and the only error boundary in the codebase is the feature-scoped
`AuthErrorBoundary` (`src/modules/user/features/auth/components/auth-error-boundary/index.tsx`),
which wraps only the auth form section. Any render error outside the auth form whites out the entire
React tree, and caught errors are dropped in production (`console.error` only in non-production).
`src/providers/` and `src/routes/` are reserved-but-empty 0-byte placeholders.

This refactor turns that demo shell into a **boring, enterprise-grade product shell** with named,
individually testable, machine-enforced layers — **shell structure only**, per the issue's explicit
"do not build the 50+ pages" mandate:

1. A single **provider composition root** — `AppProviders` under `src/providers/` — so adding a global
   provider is one edit in one ordered, documented place instead of everyone touching `index.tsx`.
2. A dedicated **route layer** under `src/routes/` — route definitions extracted out of `app.tsx`,
   a typed `route-paths.ts`, an `errorElement` on the root, a layout route, and a catch-all 404.
3. **Layout components** under `src/components/layouts/` (`RootLayout`, `AppLayout`) that own page
   chrome via React Router layout routes + `<Outlet/>`.
4. A **root, feature-agnostic error boundary** under `src/components/error-boundary/` that catches any
   render error in the tree, renders an accessible, **provider-independent** recovery fallback, and
   forwards the error to a pluggable reporter. `AuthErrorBoundary` stays feature-scoped as a
   finer-grained backstop — unchanged.
5. A small **error-reporting seam** — an `ErrorReporter` interface + a no-op default — so a
   Sentry/observability adapter can be wired later without touching boundary components.
6. **Machine enforcement** — dependency-cruiser rules that keep the shell layers decoupled from
   feature internals (and out of the heavy DI graph), plus tests proving providers compose, routes
   resolve, the 404 renders, and the root boundary catches and reports.

The single hardest constraint, surfaced during planning and **not** spelled out in the issue, is the
collision between the issue's "wire the reporter through the existing tsyringe container" instruction
and this repo's **deferred-DI auth Lighthouse budget**: `src/config/dependency-injection-config.ts`
statically pulls `tsyringe` + `reflect-metadata` + Apollo + zod, and the auth pages
(`/sign-up`, `/sign-in`) deliberately keep all of that out of their paint chunk to hold the mobile
Lighthouse gate (≥0.85, `lighthouse/lighthouserc.mobile.js:31`). A **root** boundary wraps those auth
pages, so any static import of the heavy container into the shell would bloat the auth paint chunk and
break the budget — and would also violate the existing `no-components-import-modules`
dependency-cruiser rule. This PRD resolves the tension as **Open Decision D1** (recommended: an
injectable `ErrorReporter` interface with an import-light `NoopErrorReporter`, **injected at the
composition root**, never statically importing the heavy DI container) and makes the budget protection
a hard requirement (NFR2) and a machine-enforced dependency-cruiser edge (FR12).

UI stays functional components + hooks; the only class is the error boundary (React requires it), and
the `ErrorReporter` is a deliberate OOP integration seam behind an interface, consistent with the
repo's DI conventions and the no-`static`/no-free-function gate (#100). The change lands within every
existing gate — ESLint, TypeScript, dependency-cruiser, jscpd DRY, rca metrics, 100% integration
coverage over `src/**`, i18n en/uk parity, Lighthouse mobile, visual regression, and Stryker mutation
— with **no** new suppressions, **no** `data-testid` in `src/**`, and **no** relaxed thresholds.

## Overview & Context

### Current state (verified against the repo, 2026-06-26)

- **Provider pyramid (inline).** `src/index.tsx:22-33` renders
  `<React.StrictMode>` → `<StyledEngineProvider injectFirst>` → `<ThemeProvider theme={theme}>` →
  `<CssBaseline/>` → `<React.Suspense fallback={null}>` → `<App/>`. `reflect-metadata` is the first
  import (`index.tsx:1`, required by tsyringe), fonts/theme/i18n are imported as side effects, and
  `i18n.t('root_element_missing')` is called directly (`index.tsx:17`). There is **no** `AppProviders`
  component and **no** `I18nextProvider` anywhere in `src` (i18n is a side-effect-initialized
  singleton read via `useTranslation()` and direct calls).
- **Inline router, no error/404/layout handling.** `src/app.tsx:13-31` builds `createBrowserRouter`
  with three entries: `{ element: <ProtectedRoute/>, children: [{ path: '/', element: <ButtonExample/> }] }`,
  `{ path: '/sign-up', element: <SignUp/> }`, `{ path: '/sign-in', element: <SignIn/> }` (routes are
  lazy at `app.tsx:9-11`). `RouterProvider` (`app.tsx:47`, `future={{ v7_startTransition: true }}`) is
  wrapped in a **second** `<React.Suspense fallback={null}>` (`app.tsx:46`). There is **no**
  `errorElement` on any route, **no** catch-all `{ path: '*' }`, and **no** layout route — the only
  `<Outlet/>` is `ProtectedRoute` (`protected-route/index.tsx:5-9`). The home `/` element is still the
  throwaway `ButtonExample` behind `ProtectedRoute`.
- **Duplicated, partial chrome side effects.** `app.tsx:36-44` syncs `document.documentElement.dir`
  from `i18n.dir(i18n.language)` on mount + `languageChanged`; the sibling
  `document.documentElement.lang = i18n.language` line is **commented out** (`app.tsx:39`) because
  enabling it re-hints Firefox text rendering and breaks the Playwright Firefox visual baselines.
  `src/button-example.tsx:11-13` **also** sets `document.documentElement.dir` — a second copy of the
  same side effect.
- **One feature-scoped error boundary, no production sink.** `grep getDerivedStateFromError|componentDidCatch`
  matches exactly one file: `AuthErrorBoundary` (a class with `getDerivedStateFromError`,
  `componentDidCatch`, `handleReset`). Its fallback is `<div role="alert" aria-live="assertive"
aria-atomic="true">` with a native `<button type="button">` reset and dev-only
  `<details>/<summary>/<pre>` diagnostics (gated to `NODE_ENV` development/test). It defaults to the
  `auth.error.default` i18n key, calls `useTranslation()`/`useTheme()` **inside** its fallback, is
  wired only by `auth-page-layout` (a **component**-level layout, not a router route), and
  `console.error`s only in non-production — there is **no** error-reporting sink.
- **Heavy DI container vs. auth paint budget.** `src/config/tokens.ts` is a frozen, dependency-free
  `Symbol` registry (safe to import anywhere) with **no** `ErrorReporter` token.
  `src/config/dependency-injection-config.ts` statically imports `reflect-metadata`, `@apollo/client`,
  `tsyringe`, and (transitively, via response mappers) zod, and registers every service. The auth
  store's composition root (`stores/index.ts`) loads that graph only behind a dynamic `import()` on the
  first auth action, so the auth pages never bundle it. The mobile Lighthouse gate is **score-based**
  (`categories:performance >= 0.85`, `lighthouserc.mobile.js:31`), so JS parse/execute cost on
  `/sign-up`/`/sign-in` is the lever the deferred pattern protects. An existing `ErrorHandler` service
  (`src/services/error/error-handler.ts`, `@injectable`, console logger) is a candidate logging sink.
- **Reserved-but-empty layer slots.** `src/providers/` and `src/routes/` each contain only a 0-byte
  `.gitignore`. `src/components/`, `src/services/`, `src/config/`, `src/lib/`, `src/utils/`,
  `src/types/`, `src/i18n/` all exist as top-level layers.
- **Gates (all must hold).** dependency-cruiser CommonJS rules (incl. `no-components-import-modules`
  forbidding `src/components/**` → `src/modules/**`, and a rule restricting `dependency-injection-config`
  imports to composition roots); ESLint `no-restricted-syntax` for no-`static`/free-functions in
  `src/**/*.ts` (#100, `use-*`/types/tests exempt), type-only files (#88), no `data-testid` (#90); rca
  hard metrics; jscpd `minTokens 75`/`minLines 5`/`threshold 0`; Jest 100% coverage over `src/**`
  (`src/index.tsx` excluded); i18n single `translation` namespace auto-merged by
  `scripts/localization-generator.js` from per-area `i18n/{en,uk}.json` folders (en+uk required).

### Why this change

The repo is being built to 50+ pages by many parallel human and AI contributors. Two single files —
`index.tsx` (provider pyramid) and `app.tsx` (route array) — are the only place to add a provider, a
page, a layout, or root error handling, which makes them permanent merge-conflict hotspots and a
vector for architectural drift, because there is no boring, repeatable home for those concerns. With a
single feature-scoped boundary, any uncaught render error outside the auth form drops users to a blank
screen with no recovery path, and production failures are invisible to operators. There is no layout
primitive, so every future page would re-implement chrome ad hoc, and no route-level boundary to
isolate one broken page from the shell. This issue installs the missing structure — provider root,
route layer, layouts, root boundary, reporting seam — and **machine-enforces** the layer boundaries so
the structure cannot silently erode. It is explicitly **planning/scaffolding only**: one representative
wiring of each concern, not the product pages themselves.

## Goals & Non-Goals

### Goals

- Introduce a single **provider composition root** (`AppProviders`) under `src/providers/`; slim
  `src/index.tsx` to mount only `<StrictMode><AppErrorBoundary><AppProviders><App/></AppProviders></AppErrorBoundary></StrictMode>`
  (provider order preserved, no pyramid left in `index.tsx`).
- Extract the router into a dedicated **route layer** under `src/routes/` with a typed `route-paths.ts`
  single source of truth; reduce `app.tsx` to a thin `<RouterProvider>` host.
- Add an `errorElement` on the root route, **one** layout route using `<Outlet/>`, and a catch-all
  `{ path: '*' }` **404** route that renders an accessible Not-Found page.
- Add a **root, feature-agnostic error boundary** that wraps the whole tree, renders an accessible,
  **provider-independent** recovery fallback (works even if theme/i18n failed), and forwards errors to
  a pluggable reporter; keep `AuthErrorBoundary` feature-scoped and unchanged.
- Add a small **`ErrorReporter` interface + no-op default** integration seam (injectable, behind an
  interface), wired so a Sentry adapter can be added later **without** touching boundary components and
  **without** dragging the heavy DI graph into the auth paint chunk.
- Add **dependency-cruiser rules** that forbid `src/components/**`, `src/providers/**`, and
  `src/routes/**` from importing feature internals (`src/modules/*/features/*`) and from importing the
  heavy `dependency-injection-config`; land them in the same PR so the decoupling is enforced from day
  one.
- Land within every existing gate with **no** new suppressions, **no** `data-testid` in `src/**`, and
  **no** new inline code comments; rationale lives in this spec / the PR.

### Non-Goals

- **No** product pages, navigation menus, dashboards, or auth flows — only layout/provider/route/
  boundary scaffolding plus one representative wiring of each (the home `/` stays `ButtonExample`).
- **No** concrete Sentry/observability SDK; only the `ErrorReporter` interface + `NoopErrorReporter`
  default. No network calls, no new runtime dependency on a telemetry vendor.
- **No** conversion of the existing **auth** pages to a router `AuthLayout` route — the
  component-level `AuthPageLayout` (issue #31, just shipped) and its visual baselines stay untouched
  (D2).
- **No** re-enabling of `document.documentElement.lang` — the commented line (`app.tsx:39`) stays
  deferred to the tracked a11y follow-up to avoid Firefox visual-baseline regen (D3); the dir/lang
  effect is only **relocated**, not behaviorally changed.
- **No** change to `AuthErrorBoundary`, the auth store, repositories, the deferred-DI pattern, the
  auth Lighthouse budget mechanism, or the form logic.
- **No** weakening or loosening of any existing gate (eslint, tsc, jscpd, metrics, dependency-cruiser)
  to make new imports pass.

## Scope

### In Scope

- **Provider composition root** (`src/providers/app-providers.tsx` + `src/providers/index.ts`):
  composes `StyledEngineProvider injectFirst` → `ThemeProvider` → `CssBaseline` → `I18nextProvider` →
  `Suspense`, in that order, around `children`. `index.tsx` mounts it.
- **Route layer** (`src/routes/routes.tsx`, `src/routes/route-paths.ts`, `src/routes/index.ts`):
  `createBrowserRouter` config restructured as a `RootLayout` layout route with an `errorElement`, the
  existing `/`, `/sign-up`, `/sign-in` routes, and a catch-all `{ path: '*', element: <NotFound/> }`.
  Typed path constants for `/`, `/sign-up`, `/sign-in`, and the 404 wildcard.
- **Layout components** (`src/components/layouts/root-layout.tsx`, `app-layout.tsx`): `RootLayout`
  owns the relocated dir/lang side effect + `<Outlet/>`; `AppLayout` is the authenticated/app chrome
  placeholder wrapping the protected `/` area via `<Outlet/>`.
- **Root error boundary** (`src/components/error-boundary/app-error-boundary.tsx`, `error-fallback.tsx`,
  `index.ts`): a feature-agnostic class boundary (`getDerivedStateFromError`/`componentDidCatch`) that
  renders a provider-independent `ErrorFallback` and calls `reporter.report(...)`. No `@auth/*`
  imports, no `auth.*` i18n keys.
- **Not-Found page** (`src/components/not-found/not-found.tsx`): the accessible 404 catch-all element.
- **Error-reporting seam** (`src/services/error-reporting/error-reporter.ts` for the
  `NoopErrorReporter` class, `src/services/error-reporting/index.ts`, the `ErrorReporter` interface in
  a type-only file, and an `ErrorReporter` token added to `src/config/tokens.ts`).
- **`src/index.tsx`** (Modify): slimmed to mount the root boundary + `AppProviders` + `App`, preserving
  `reflect-metadata` first and the eager i18n init.
- **`src/app.tsx`** (Modify): reduced to a thin `<RouterProvider router={router}>` host importing the
  router from `src/routes`; the dir/lang effect moves to `RootLayout`.
- **`src/button-example.tsx`** (Modify): remove its duplicate `document.documentElement.dir` side
  effect (now owned once by `RootLayout`).
- **i18n** (`src/components/not-found/i18n/{en,uk}.json`, `src/components/error-boundary/i18n/{en,uk}.json`):
  new top-level shell namespaces (`not_found.*`, `shell_error.*`) for the 404 page and the boundary's
  _enhanced_ (provider-available) fallback copy; the boundary's **degraded** baseline copy is hardcoded
  (see AR/Architecture).
- **dependency-cruiser** (`.dependency-cruiser.js`): new layer rules (see FR12).
- **All test layers + coverage**: unit (provider composition, route resolution, 404, root boundary
  catch + reporter, layouts), integration (100% over `src/**`), and the i18n parity / tooling updates
  the above imply.

### Out of Scope / Unchanged

- `AuthErrorBoundary`, the auth store, repositories, the deferred-DI composition root, the auth
  Lighthouse-budget mechanism, the auth pages' component-level `AuthPageLayout`, `usePageTitle`, and
  all form logic.
- The concrete error-reporting vendor adapter (Sentry/etc.), web-vitals emission, and structured
  logging — future work behind the seam.
- A new `AuthLayout` router route (D2), re-enabling `<html lang>` (D3), a skip link, and any visible
  redesign of `ButtonExample`/the home page.
- The `ErrorHandler` service (`src/services/error/error-handler.ts`) — left as-is; whether the root
  boundary logs through it is Open Decision D5.

## Functional Requirements

Requirement IDs are stable and referenced by the Architecture and Epics documents.

- **FR1 — Provider composition root.** A single `AppProviders` component MUST compose **all** global
  providers in one ordered place: `StyledEngineProvider injectFirst` → `ThemeProvider` → `CssBaseline`
  → `I18nextProvider` → `Suspense`, wrapping `children`. The order MUST preserve `injectFirst` and
  `CssBaseline`-before-children so the MUI/global style cascade is unchanged.
- **FR2 — Slim `index.tsx`.** After the change, `src/index.tsx` MUST mount only
  `<React.StrictMode><AppErrorBoundary …><AppProviders><App/></AppProviders></AppErrorBoundary></React.StrictMode>`
  (plus the `#root` lookup and the `reflect-metadata`-first import); **no** provider pyramid may remain
  in `index.tsx`. The eager i18n side-effect init MUST still run before `i18n.t('root_element_missing')`
  is used.
- **FR3 — Route layer extraction.** The `createBrowserRouter` configuration MUST live under
  `src/routes/` (not inline in `app.tsx`); `app.tsx` MUST only host `<RouterProvider router={router}>`
  (keeping `future={{ v7_startTransition: true }}`). No route array may remain inline in `app.tsx`.
- **FR4 — Typed route paths.** A `src/routes/route-paths.ts` MUST define typed constants for every
  path the shell owns (`/`, `/sign-up`, `/sign-in`, and the `*` wildcard) as the single source of
  truth; the route config MUST consume them. (`ProtectedRoute`'s `/sign-in` literal MAY adopt the
  constant; if not, it MUST stay consistent — see D6.)
- **FR5 — Root `errorElement`.** The router MUST attach an `errorElement` to the root layout route so
  a thrown loader/render error inside the routed tree resolves to an accessible error element rather
  than a blank screen.
- **FR6 — Catch-all 404.** The router MUST define a catch-all `{ path: '*', element: <NotFound/> }`;
  navigating to an unknown path MUST render the Not-Found page (verified by a test), with no redirect.
- **FR7 — Layout route with `<Outlet/>`.** At least one **router layout route** (`RootLayout`) using
  `<Outlet/>` MUST exist under `src/components/layouts/`; the routed pages MUST render through it. The
  protected `/` area MUST render through an `AppLayout` (the representative app-chrome layout).
- **FR8 — Root error boundary.** A root, feature-agnostic error boundary (`AppErrorBoundary`, a class
  with `getDerivedStateFromError` + `componentDidCatch`) MUST wrap the entire app tree so a render-time
  throw anywhere renders an accessible recovery fallback instead of unmounting the tree. It MUST import
  nothing from `@auth/*` or `src/modules/**` and MUST use no `auth.*` i18n keys (verified by
  dependency-cruiser).
- **FR9 — Accessible, recoverable fallback.** The root boundary's `ErrorFallback` MUST render an
  accessible recovery UI with a working reset/retry action that clears the error state and re-renders
  the tree (verified by a test that throws inside a routed child and asserts the fallback + a working
  reset). It MUST degrade gracefully — rendering legibly **without** depending on the MUI theme,
  Emotion runtime, or a ready i18n instance (the providers may be exactly what failed; see AR section).
- **FR10 — `ErrorReporter` seam.** An `ErrorReporter` interface (`report(error: Error, context?:
Record<string, unknown>): void`) with a default `NoopErrorReporter` implementation MUST exist; the
  root boundary MUST call `reporter.report(error, info)` in `componentDidCatch`. A test MUST assert the
  injected reporter receives the thrown error.
- **FR11 — Injectable, swappable reporter.** `NoopErrorReporter` MUST be an `@injectable()` class
  (instance method, no `static`, no free functions — #100), and an `ErrorReporter` token MUST be added
  to `src/config/tokens.ts`, so a Sentry/observability adapter can be registered later **without**
  editing boundary components. The default reporter module MUST be import-light (no Apollo/zod/heavy
  graph) so it can sit in the paint path safely (see NFR2, D1).
- **FR12 — Machine-enforced decoupling.** `.dependency-cruiser.js` MUST add rules (severity `error`)
  forbidding `src/components/**`, `src/providers/**`, and `src/routes/**` from importing feature
  internals (`^src/modules/[^/]+/features/`), **and** forbidding those three shell layers (plus the
  root boundary) from importing `src/config/dependency-injection-config.ts` (the heavy DI graph). The
  existing `no-components-import-modules` rule MUST NOT be loosened; `make lint` (which runs
  dependency-cruiser) MUST pass.
- **FR13 — `AuthErrorBoundary` preserved.** `AuthErrorBoundary` MUST remain feature-scoped under
  `@auth/`, continue to wrap the auth form section (no regression), and stay a finer-grained backstop;
  the root boundary is an **additional** backstop, not a replacement.
- **FR14 — Single chrome side effect.** The `document.documentElement.dir` side effect MUST be owned in
  **one** place (`RootLayout`); the duplicate in `button-example.tsx:11-13` MUST be removed. Behavior
  (dir synced on mount + `languageChanged`, `lang` left commented per D3) MUST be otherwise unchanged.

## Non-Functional Requirements

Requirement IDs are stable and referenced by the Architecture and Epics documents.

- **NFR1 — No visual/behavioral regression on existing routes.** The rendered output of `/`,
  `/sign-up`, and `/sign-in` MUST be unchanged: the home stays `ButtonExample`, the auth pages keep
  their component-level `AuthPageLayout` and existing baselines, and provider order/`injectFirst`/
  `CssBaseline` placement are preserved. New UI (404, root fallback) is additive.
- **NFR2 — Auth Lighthouse budget protected.** The change MUST NOT regress the mobile Lighthouse score
  on `/sign-up`/`/sign-in` below the CI gate (`>= 0.85`, `lighthouserc.mobile.js:31`). The root
  boundary, `AppProviders`, `RootLayout`, the route layer, and the default `ErrorReporter` MUST NOT add
  `tsyringe`/Apollo/zod (i.e. `src/config/dependency-injection-config.ts`) to the auth paint chunk's
  static import graph. Enforced structurally (D1) and by dependency-cruiser (FR12).
- **NFR3 — rca metrics gate.** Every new/changed file MUST pass `make lint-metrics`: ≤10 functions/
  closures per file (≤6 closures, ≤15 total), Cyclomatic ≤10, Cognitive ≤15, ABC ≤17, ≤3 args, ≤3 exit
  points, function LLOC ≤10 / PLOC ≤40 / SLOC ≤45, file LLOC ≤120 / PLOC ≤300 / SLOC ≤350, Halstead +
  MI bands; an injectable class ≤8 public methods / ≤2 public attributes. New units get their own small
  files (the route config, the boundary, the fallback, each layout, the reporter are separate files).
- **NFR4 — jscpd DRY gate.** The implementation MUST pass `make lint-dup` (`.jscpd.json`:
  `minTokens 75`, `minLines 5`, `threshold 0`, mode `mild`) by extracting shared fragments — never by
  ignore directives. The root `ErrorFallback` and `AuthErrorBoundary`'s fallback markup MUST NOT form a
  ≥75-token clone; shared fallback structure is extracted or kept under the floor.
- **NFR5 — No `data-testid`; semantic selectors.** Source MUST ship no `data-testid` (ESLint `error`
  in `src/**`); tests MUST locate elements by role/label/text (`getByRole`, `getByLabelText`,
  `getByText`), using a stable `id` only as a last resort. The 404 and fallback MUST be locatable by
  role/heading/text.
- **NFR6 — No `static`/free functions in `src/**/_.ts`.** Non-React `.ts`logic (the`ErrorReporter`default, any helper) MUST use instance methods on an`@injectable()`class — no`static`, no
standalone/`export`functions, no top-level arrow`const`s — per the `no-restricted-syntax`gate.
React`.tsx`components (incl. the class boundary) and`use-_` hooks are exempt.
- **NFR7 — Type-only files (#88).** Every new prop/contract type (`AppProvidersProps`,
  `AppErrorBoundaryProps`, `AppErrorBoundaryState`, `ErrorFallbackProps`, `ErrorReporter`,
  `RootLayoutProps`/`AppLayoutProps` as needed) MUST live in dedicated per-area `types/` files,
  imported via `import type`; logic files MUST declare no `interface`/`type`. Enforced by ESLint +
  dependency-cruiser (`type-files-imported-as-type-only`, `type-files-no-runtime-imports`).
- **NFR8 — Faker builders (#101).** Any test that needs arbitrary domain data MUST use
  `@tests/builders`, seeded deterministically; hardcode only fixed contracts (route literals, i18n
  keys, role/politeness strings, error messages).
- **NFR9 — i18n en/uk parity.** Every new i18n key (`not_found.*`, `shell_error.*`) MUST exist in both
  `en.json` and `uk.json` under a unique top-level namespace (no collision with `auth`, `footer`,
  `buttons`, `sign_up`, `sign_in`, `notifications`, `root_element_missing`), be merged by
  `scripts/localization-generator.js`, and stay in sync. No English string used in the **healthy** path
  may be hard-coded in `src/**` (the **degraded** boundary baseline copy is the deliberate exception —
  see AR14).
- **NFR10 — 100% integration coverage over `src/**`.** The global 100% coverage gate (branches/
functions/lines/statements) MUST hold: every new source file (providers, routes, layouts, boundary,
fallback, 404, reporter) MUST be fully covered by positive, negative, and edge-case tests; deleted
side effects (button-example dir) MUST not leave uncovered branches. `src/index.tsx`remains
coverage-excluded, so coverage-bearing logic MUST live in covered modules, not`index.tsx`.
- **NFR11 — No suppressions, no new inline comments.** No `eslint-disable`, `@ts-ignore`,
  `prettier-ignore`, markdownlint/editorconfig disable, and no new inline code comments. Gate failures
  MUST be fixed at the root.
- **NFR12 — Mutation testing.** Tests MUST assert exact strings/attributes (the `*` wildcard path, the
  `role="alert"` on the fallback, the 404 heading/`document.title`, the reporter being called with the
  thrown error, the dependency-cruiser rule names) so Stryker reports no surviving mutant on the new
  branches.
- **NFR13 — commitlint / squash-merge discipline.** Commit headers MUST be ≤100 chars with a `(#104)`
  scope; the repo is squash-merge-only and the `cubic`/auto bots rewrite PR bodies, so the `Closes #104`
  reference MUST ride the commit/squash message, not the PR body.
- **NFR14 — Scalability shape.** The route layer, layouts, and provider root MUST be structured so
  adding a future page/provider/layout is a localized edit (a new route entry, a new provider line, a
  new layout file) and not an edit to a shared inline hotspot — the explicit anti-merge-conflict goal.

## Accessibility Requirements

These expand NFR1/NFR5 and MUST be validated by the accessibility review. They distinguish the **root
error fallback** (an error _event_, may render in a **degraded** tree) from the **404 page** (a normal
routed page in the **healthy** provider tree). Source: accessibility-lead review (2026-06-26).

- **AR1 — Root fallback live region (WCAG 4.1.3, AA).** The root fallback's message MUST be an
  assertive live region via `role="alert"` (which implies `aria-live="assertive"`/`aria-atomic`).
  Because the boundary can catch during _initial_ render (nothing to interrupt), the live region MUST
  be paired with focus management (AR5). The assertive region MUST be scoped to the heading/message
  text — the reset button and dev diagnostics MUST live **outside** the alert subtree (see D-A).
- **AR2 — 404 is not an alert (WCAG 4.1.3 AA / 1.3.1 A).** The 404 page MUST NOT use `role="alert"` or
  `aria-live="assertive"`. It conveys "not found" via a visible, descriptive `<h1>`; any SPA
  route-change announcement MUST be polite (`role="status"`), not assertive (scope of a polite
  route-announcer is D-B).
- **AR3 — Single `<h1>` + heading order (WCAG 1.3.1 A / 2.4.6 AA).** Each surface MUST render exactly
  one descriptive, localized `<h1>` with no skipped levels; the 404 `<h1>` MUST NOT collide with chrome
  headings, and the root fallback `<h1>` is the only `<h1>` in the degraded tree.
- **AR4 — Page title (WCAG 2.4.2 A).** The 404 route MUST set a descriptive localized `document.title`
  ("Not found - VilnaCRM"-style) on mount (mirroring `usePageTitle`). The root fallback updates the
  title best-effort only (a severe crash may prevent it — acceptable, not a hard gate).
- **AR5 — Focus on mount (WCAG 2.4.3 A).** On render, focus MUST move programmatically to the fallback
  heading/container (`tabindex="-1"` via a ref) so keyboard/SR users are not stranded in
  destroyed/replaced DOM. The mechanism MUST be DOM-ref based (no provider-dependent hooks) so it works
  in the degraded path.
- **AR6 — Focus after reset/retry (WCAG 2.4.3 A).** The post-reset focus landing point MUST be
  deterministic (restored `main`/`<h1>`), not the removed button (see D-D for reset semantics).
- **AR7 — Keyboard operability (WCAG 2.1.1 / 2.1.2 A).** Reset/retry MUST be a native
  `<button type="button">` (Enter/Space); all links MUST be native `<a>`/router links (Enter). Logical
  DOM/tab order, no positive `tabindex`, no keyboard trap.
- **AR8 — Visible focus indicator (WCAG 2.4.7 AA / 1.4.11 AA).** Every focusable control MUST show a
  focus indicator ≥3:1 against adjacent colors. The **degraded** root fallback MUST NOT rely on the MUI
  theme for its ring — it ships a baseline static `outline` that survives theme failure. The healthy
  404 MAY reuse the established `2px solid` `primary`-based ring (subject to the `UIBackToMain`
  contrast note, AR10).
- **AR9 — Descriptive link/CTA text (WCAG 2.4.4 A / 2.4.6 AA).** Recovery links ("Go to homepage" /
  "Back to sign-in") MUST use descriptive, localized text naming the destination — never "click
  here"/"go back" (exact wording + destination set is D-E, tied to #31's link-text decision).
- **AR10 — Label in Name (WCAG 2.5.3 A).** Each control's accessible name MUST contain its visible
  label and be localized. If the 404 reuses `UIBackToMain` (whose `aria-label="Back"` currently
  overrides the visible localized label — a pre-existing 2.5.3/i18n defect), the defect MUST be fixed
  deliberately (drop/localize the redundant `aria-label`), not inherited (D-F).
- **AR11 — Text contrast (WCAG 1.4.3 AA).** All fallback/404 text MUST be ≥4.5:1 (≥3:1 large) against
  its background. The degraded fallback MUST hit this **without** theme tokens — the spec MUST name the
  exact hardcoded foreground/background pair used when Emotion/theme is unavailable.
- **AR12 — Non-text/UI contrast (WCAG 1.4.11 AA).** The reset button boundary and any meaning-bearing
  icon MUST be ≥3:1 against background; decorative imagery is exempt but MUST be marked decorative
  (AR15).
- **AR13 — Graceful styling degradation (robustness).** The root fallback MUST render legibly with **no**
  MUI theme and **no** Emotion runtime (use inline/static CSS for layout, contrast, focus) — the
  styling providers may be exactly what failed. No `useTheme`/`styled` in the degraded path (a
  deliberate break from the `AuthErrorBoundary` pattern, which does use them).
- **AR14 — i18n + lang consistency (WCAG 3.1.1 A / 3.1.2 AA).** 404 strings ship en+uk parity. The
  root fallback MUST NOT assume `useTranslation` is ready — it needs hardcoded baseline copy; the
  enhanced (provider-available) copy MAY use i18n. If degraded copy is English while `<html lang>` is
  otherwise, the fallback subtree MUST set a consistent `lang` or use language-neutral copy (coordinate
  with the deferred `lang` reinstatement, D3 / D-C).
- **AR15 — Decorative imagery (WCAG 1.1.1 A).** Any 404 illustration is decorative → `alt=""
aria-hidden="true"`; the root fallback SHOULD avoid asset-dependent imagery (assets may be
  unavailable mid-crash).
- **AR16 — Reduced motion (WCAG 2.3.3 / repo practice).** Any animation on either surface MUST be
  gated behind `prefers-reduced-motion: reduce`; recommendation: the root fallback ships with **no**
  animation (motion utilities may be unavailable in the degraded path).
- **AR17 — Landmarks (WCAG 1.3.1 A / 2.4.1 A).** The 404 wraps content in `<main>` and preserves the
  app skip link/landmarks (it lives in the healthy chrome). The root fallback exposes its recovery
  content within a `<main>` (or labelled region); a skip link may be absent in the degraded path
  (acceptable).
- **AR18 — Dev-only diagnostics (WCAG 4.1.2 A, robustness).** The dev/test `<details>/<summary>/<pre>`
  block MUST use the native disclosure (keyboard operable, correct name/role/state), stay gated out of
  production (mirror `shouldShowErrorDetails`), and live **outside** the assertive alert subtree so raw
  error text is not announced (ties to AR1/AR18).

## Acceptance Criteria

Each criterion is testable and traceable to the requirement IDs.

- **AC1 (FR1, FR2, NFR1).** `AppProviders` composes the providers in the required order; `index.tsx`
  contains no provider pyramid and mounts only `<StrictMode><AppErrorBoundary><AppProviders><App/></AppProviders></AppErrorBoundary></StrictMode>`; a test renders through `AppProviders` and asserts theme + i18n + CssBaseline are in effect. Verified by unit test + code review.
- **AC2 (FR3, FR4).** No `createBrowserRouter` array remains inline in `app.tsx`; `app.tsx` only hosts
  `<RouterProvider>`; the router is imported from `src/routes`; `route-paths.ts` exports typed
  constants consumed by the config. Verified by unit test + grep + code review.
- **AC3 (FR6, AR2, AR3, AR4).** Navigating to an unknown path renders the Not-Found page (one
  `getByRole('heading', { level: 1 })`, descriptive text, `<main>` landmark, descriptive
  `document.title`, **no** `role="alert"`); a known path does not render it. Verified by a router unit
  test using `createMemoryRouter` with `initialEntries`.
- **AC4 (FR5, FR7).** The router defines an `errorElement` on the root layout route and the routed
  pages render through `RootLayout`'s `<Outlet/>`; the protected `/` renders through `AppLayout`.
  Verified by unit test (route config shape + render through outlet).
- **AC5 (FR8, FR9, AR1, AR5, AR7).** Mounting the app and throwing inside a routed child renders the
  root fallback with `role="alert"` (scoped to the message), focus moved to the heading/container, and
  a keyboard-operable native reset button — instead of an unmounted/blank tree. Verified by unit test
  (throwing child + role/focus/reset assertions).
- **AC6 (FR9, AR6).** Activating the reset/retry control clears the boundary error state and
  re-renders the children (recovered tree), landing focus on a deterministic target. Verified by unit
  test (throw → reset → recovered content + focus).
- **AC7 (FR10, FR11, NFR12).** An `ErrorReporter` interface + `NoopErrorReporter` (`@injectable`)
  exist; an `ErrorReporter` token is in `tokens.ts`; the root boundary calls `report(error, info)` in
  `componentDidCatch`; a test injects a mock reporter and asserts it receives the thrown error.
  Verified by unit test (mock reporter spy).
- **AC8 (FR8, FR12, NFR2).** The root boundary and `ErrorFallback` import nothing from `@auth/*`,
  `src/modules/**`, or `src/config/dependency-injection-config.ts`; new dependency-cruiser rules forbid
  `src/components/**`, `src/providers/**`, `src/routes/**` from importing feature internals or the heavy
  DI graph; `make lint` (dependency-cruiser) passes with the existing `no-components-import-modules`
  rule intact. Verified by `make lint-deps` + grep + code review.
- **AC9 (FR9, AR11, AR13, AR14).** The root fallback renders legibly when the MUI theme/Emotion runtime
  and i18n are unavailable: a test renders `ErrorFallback` with no `ThemeProvider`/`I18nextProvider`
  and asserts it still shows the hardcoded baseline copy with a focusable reset and a contrast-safe
  static style. Verified by unit test (no-provider render).
- **AC10 (FR13, NFR1).** `AuthErrorBoundary` remains feature-scoped, still wraps the auth form section,
  and is unchanged; the auth pages render identically. Verified by the preserved auth tests + code
  review (no diff to `AuthErrorBoundary`).
- **AC11 (FR14, NFR1).** `document.documentElement.dir` is synced in exactly one place (`RootLayout`)
  on mount + `languageChanged`; `button-example.tsx` no longer sets `dir`; the commented `lang` line
  stays deferred (D3). Verified by unit test (RootLayout dir effect + grep that button-example has no
  dir effect).
- **AC12 (FR1, FR2, NFR2).** A bundle/chunk assertion (mock or import-graph test) confirms the shell
  entry path (`index.tsx` → `AppErrorBoundary` → `AppProviders` → `RouterProvider` → lazy routes) does
  **not** statically import `src/config/dependency-injection-config.ts`; the auth pages' paint chunk is
  free of tsyringe/Apollo/zod. Verified by unit/import-graph test + dependency-cruiser (AC8).
- **AC13 (NFR9).** Every new i18n key (`not_found.*`, `shell_error.*`) exists in both `en.json` and
  `uk.json` under a unique namespace and is merged into `localization.json`. Verified by the i18n
  parity check + generator run.
- **AC14 (NFR10).** Integration coverage over `src/**` stays at 100% with all new files covered by
  positive/negative/edge tests. Verified by `make test-integration` in CI.
- **AC15 (NFR3, NFR4, NFR6, NFR7, NFR11).** `make lint-metrics`, `make lint-dup`, ESLint (no
  `data-testid`, no `static`/free functions in `src/**/*.ts`), dependency-cruiser (type-only files),
  and TypeScript all pass with no new suppressions, ignores, or inline code comments. Verified in CI.
- **AC16 (NFR12).** Stryker reports no surviving mutant on the new branches (the `*` wildcard, the
  fallback `role`, the 404 heading/title, the reporter call, the dependency-cruiser rule wiring exposed
  via tests). Verified by `make test-mutation`.

## Open Decisions

These items are genuine product/architecture decisions that change the implementation; each has a
recommendation. Per BMAD practice (mirroring #31's D1-D3), they are recorded here with recommendations
and a default working assumption used by the Architecture and Epics; the owner ratifies or overrides
before implementation. D-A…D-F are the accessibility-lead's open items folded in.

- **D1 — `ErrorReporter` wiring vs. the auth Lighthouse budget. [PRIMARY]** The issue says "wire the
  reporter through the existing tsyringe container." But `src/config/dependency-injection-config.ts`
  statically pulls tsyringe + reflect-metadata + Apollo + zod; the root boundary wraps the auth pages,
  so any static import of that container into the shell bloats the auth paint chunk (NFR2) **and**
  violates `no-components-import-modules`. Options: **(A, RECOMMENDED)** an `ErrorReporter` interface +
  import-light `@injectable` `NoopErrorReporter` in a **standalone** module (no Apollo/zod), **injected
  at the composition root** (passed as a prop to `AppErrorBoundary` at the `index.tsx` mount site,
  defaulting to `NoopErrorReporter`); the boundary never imports the heavy container. A real adapter is
  added later via lazy/dynamic import so it never enters the initial chunk. This honors "OOP class
  behind an interface, injected not hard-coded" and is the most testable (inject a mock reporter — AC7),
  while bulletproofing the budget. **(B)** resolve lazily inside `componentDidCatch` via
  `await import('@/config/dependency-injection-config')` (most literal to the issue; report() becomes
  async/error-time-only; heavy chunk loads only on error). **(C)** a dedicated lightweight shell
  container (token in `tokens.ts` + a separate import-light registration module) resolved synchronously.
  **Recommendation: A.** It is a deliberate, documented deviation from "resolve via `container.resolve`"
  that the owner MUST ratify; the `ErrorReporter` token is still added to `tokens.ts` (FR11) so the DI
  path exists for the future adapter.
- **D2 — Layout scope.** The issue lists `RootLayout`, `AuthLayout`, `AppLayout`. The auth pages
  already use a **component**-level `AuthPageLayout` (issue #31, just shipped, visual-baseline- and
  Firefox-`lang`-sensitive). Options: **(A, RECOMMENDED)** introduce `RootLayout` (the layout route
  hosting `errorElement` + `<Outlet/>` + the dir/lang effect) and `AppLayout` (protected `/` chrome);
  **do not** convert the auth pages to a router `AuthLayout` route — leave `AuthPageLayout` untouched.
  Satisfies "≥1 layout route with `<Outlet/>`" with minimal risk. **(B)** also build a router
  `AuthLayout` route and migrate `/sign-up`/`/sign-in` onto it (more faithful to the issue's list, but
  re-touches #31's baselines + the Firefox `lang` issue). **Recommendation: A.**
- **D3 — `<html lang>` re-enablement.** The commented `lang` line (`app.tsx:39`) is disabled because
  enabling it breaks Firefox visual baselines (a tracked a11y follow-up owns re-enabling + baseline
  regen). Options: **(A, RECOMMENDED)** relocate the dir/lang effect into `RootLayout` **as-is** (lang
  still commented), no behavior change, no baseline regen in #104. **(B)** re-enable `lang` here and
  regenerate the Firefox baselines under `lang="uk"`. **Recommendation: A** (keep #104 scope =
  structure, not the a11y/baseline change).
- **D4 — 404 & fallback chrome.** Options: **(A, RECOMMENDED)** the **404** reuses shared chrome
  (`UIBackToMain` + `UIFooter`) inside the healthy tree (fixing the `UIBackToMain` `aria-label` defect,
  AR10), while the **root fallback** is deliberately minimal and provider-independent (AR13) — no shared
  MUI chrome, hardcoded baseline copy + inline styles. **(B)** both reuse shared chrome (risky for the
  fallback — depends on theme being healthy). **(C)** both standalone minimal (less consistent 404).
  **Recommendation: A.**
- **D5 — Boundary logging sink.** Should the root boundary's reporter delegate to the existing
  `ErrorHandler` service (`src/services/error/error-handler.ts`)? **Recommendation: NO for #104** —
  `ErrorHandler` is resolved via the heavy container and would reintroduce the D1/NFR2 problem; keep the
  default `NoopErrorReporter` import-light and standalone. Revisit when the real adapter lands.
- **D6 — `route-paths.ts` adoption by `ProtectedRoute`.** Should `ProtectedRoute`'s hardcoded
  `<Navigate to="/sign-in">` adopt the typed constant? **Recommendation: YES if it stays within auth
  layering** (the constant lives in `src/routes`, a shell layer; `ProtectedRoute` is a feature, and
  features importing `src/routes` must not violate a layer rule). If importing `src/routes` from a
  feature is disallowed by the new rules, keep the literal and assert consistency by test instead.
- **D-A (AR1).** Root announcement model: whole-container `role="alert"` vs. a scoped live region +
  programmatic focus to the heading. **Recommendation: scoped region + focus** (more control, avoids
  announcing the button/diagnostics).
- **D-B (AR2).** Does a global polite SPA route-change announcer exist, or should #104 introduce one
  for the 404 (and future routes)? **Recommendation: out of scope for #104** — the visible `<h1>` +
  `document.title` suffice; flag a polite announcer as a follow-up (sizing risk).
- **D-C (AR14).** Degraded baseline language and `<html lang>` consistency — coordinate with D3.
  **Recommendation: language-neutral or English baseline copy with a matching `lang` on the fallback
  subtree** until the `lang` reinstatement lands.
- **D-D (AR6).** Root reset semantics: in-place subtree re-mount vs. full page reload. **Recommendation:
  in-place re-mount** (clear boundary state) for recoverability; document the post-reset focus target
  (AR6).
- **D-E (AR9).** Exact 404 CTA wording/destinations (homepage vs. sign-in vs. both) — ties to #31's D2.
  **Recommendation: a single descriptive "Go to homepage" link** plus the reused back-to-main chrome;
  defer richer wording to the #31 follow-up.
- **D-F (AR10/AR17).** Reuse `UIBackToMain`/`UIFooter` on the 404 (and therefore fix the inherited
  `aria-label="Back"` 2.5.3 defect) vs. a bespoke CTA. **Recommendation: reuse + fix the defect
  deliberately** (consistency; one small a11y win).

## Risks & Mitigations

| ID  | Risk                                                                                                                                              | Mitigation                                                                                                                                                                                                    |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| R1  | Wiring the reporter "via the container" (issue text) drags tsyringe/Apollo/zod into the auth paint chunk and breaks the mobile Lighthouse budget. | D1 (recommend prop-injected import-light `NoopErrorReporter`, no heavy-container import) + NFR2 + FR12 dependency-cruiser edge forbidding shell → `dependency-injection-config`; AC12 import-graph assertion. |
| R2  | Moving the provider pyramid into `AppProviders` breaks the MUI/global style cascade (`injectFirst`, `CssBaseline` order).                         | FR1 fixes the exact order; NFR1 forbids visual regression; existing auth/home render + visual baselines verify (AC1, AC10).                                                                                   |
| R3  | The root fallback uses `useTheme`/`useTranslation` (like `AuthErrorBoundary`) and itself crashes when those providers are the failure.            | AR13/AR14/FR9 require a provider-independent degraded path (inline styles, hardcoded copy); AC9 renders the fallback with no providers.                                                                       |
| R4  | Re-locating the dir/lang effect accidentally re-enables `lang` and regenerates Firefox visual baselines.                                          | D3 (keep `lang` commented, relocate as-is); FR14/AC11 assert single dir effect with `lang` unchanged.                                                                                                         |
| R5  | A new dependency-cruiser rule overlaps/conflicts with the existing `no-components-import-modules` or breaks a legitimate import.                  | FR12 keeps the existing rule intact and adds **narrower** providers/routes rules + a DI-graph edge; uses the established backreference idiom; `make lint-deps` proves zero current violations.                |
| R6  | The root `ErrorFallback` and `AuthErrorBoundary` fallback form a ≥75-token jscpd clone.                                                           | NFR4: extract shared structure or keep under the floor; the root fallback is deliberately different (provider-independent), reducing overlap; `make lint-dup` gates it.                                       |
| R7  | New small files push a file past the rca ≤10-functions cap or the boundary class past ≤8 public methods.                                          | NFR3: each concern is its own small file (route config, boundary, fallback, each layout, reporter); the boundary keeps a minimal public surface.                                                              |
| R8  | 100% coverage fails because `index.tsx` logic is uncovered (it is coverage-excluded).                                                             | NFR10: keep coverage-bearing logic in covered modules (boundary/fallback/providers/routes), not `index.tsx`; only the thin mount lives in `index.tsx`.                                                        |
| R9  | The 404 reuses `UIBackToMain` and silently inherits its `aria-label="Back"` 2.5.3/i18n defect.                                                    | D-F/AR10: reuse **and fix** the defect deliberately (drop/localize the redundant `aria-label`), covered by a test.                                                                                            |
| R10 | i18n key collision (single `translation` namespace, silent overwrite) between shell keys and existing keys.                                       | NFR9: unique top-level `not_found.*` / `shell_error.*` namespaces; en+uk parity; generator merge verified (AC13).                                                                                             |
| R11 | The `(#104)` squash message / `Closes #104` is dropped because a bot rewrites the PR body.                                                        | NFR13: the closer rides the squash message (squash-merge-only repo); commitlint header ≤100 chars with `(#104)` scope.                                                                                        |
| R12 | Scope creep into building real pages/nav (the issue forbids it).                                                                                  | Non-Goals + Scope: shell structure only, one representative wiring of each; home stays `ButtonExample`.                                                                                                       |

## Success Metrics

- **Structure:** `AppProviders` (one composition root), a `src/routes/` layer with typed paths +
  `errorElement` + a layout route + a 404 catch-all, `RootLayout`/`AppLayout`, and a root boundary all
  exist; `index.tsx` and `app.tsx` are thin (FR1-FR8, AC1-AC5).
- **Reliability:** throwing inside a routed child renders an accessible, recoverable root fallback with
  a working reset and an injected reporter receiving the error — never a blank tree (FR8-FR11, AC5-AC7).
- **Decoupling (machine-enforced):** dependency-cruiser forbids the shell layers from importing feature
  internals and the heavy DI graph; the existing rule is intact; `make lint-deps` green (FR12, AC8).
- **Budget protected:** the shell entry path does not statically import the DI container; the auth
  mobile Lighthouse score stays ≥0.85 (NFR2, AC12).
- **Accessibility:** the 404 is a polite, descriptive, `<main>`-wrapped page with one `<h1>` and a
  title; the root fallback is an assertive, focus-managed, keyboard-operable, **provider-independent**
  recovery UI (AR1-AR18, AC3, AC5-AC6, AC9).
- **No regression:** `/`, `/sign-up`, `/sign-in` render identically; `AuthErrorBoundary` unchanged;
  single dir effect; `lang` deferred (NFR1, AC10-AC11).
- **Gate health:** ESLint / tsc / dependency-cruiser / `make lint-dup` / `make lint-metrics` / i18n
  parity green with no suppressions; 100% integration coverage over `src/**`; no surviving Stryker
  mutant on the new branches (NFR3-NFR12, AC13-AC16).
- **Decision discipline:** D1 (reporter wiring) is ratified by the owner before implementation; no
  shell module statically imports the heavy DI container.
