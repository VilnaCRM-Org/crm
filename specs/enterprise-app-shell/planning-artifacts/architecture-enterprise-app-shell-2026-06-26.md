---
status: 'complete'
workflowType: 'architecture'
project_name: 'crm'
date: '2026-06-26'
issue: 'https://github.com/VilnaCRM-Org/crm/issues/104'
inputDocuments:
  - 'https://github.com/VilnaCRM-Org/crm/issues/104'
  - 'specs/enterprise-app-shell/planning-artifacts/prd-enterprise-app-shell-2026-06-26.md'
  - 'src/index.tsx'
  - 'src/app.tsx'
  - 'src/button-example.tsx'
  - 'src/i18n.js'
  - 'src/config/i18n-config.js'
  - 'src/config/tokens.ts'
  - 'src/config/dependency-injection-config.ts'
  - 'src/services/error/error-handler.ts'
  - 'src/styles/theme.ts'
  - 'src/modules/user/features/auth/components/auth-error-boundary/index.tsx'
  - 'src/modules/user/features/auth/types/auth-error-boundary/index.ts'
  - 'src/modules/user/features/auth/components/auth-page-layout/index.tsx'
  - 'src/modules/user/features/auth/components/protected-route/index.tsx'
  - 'src/modules/user/features/auth/stores/index.ts'
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
  - '_bmad/config.yaml'
  - 'specs/README.md'
---

# Architecture - Refactor App Shell into an Enterprise Product Shell (Issue #104)

**Author:** Winston (Architect) **Date:** 2026-06-26 **Source:** VilnaCRM-Org/crm#104

## Approach Summary

This is a brownfield **structural** refactor: extract the inline provider pyramid and inline router
into named, machine-enforced layers, and add the missing reliability/scalability primitives (root
boundary, 404, layout routes, error-reporting seam) — **scaffolding only**, no product pages. Today
the shell lives in two hotspot files: `src/index.tsx:22-33` hand-stacks the provider pyramid, and
`src/app.tsx:13-31` declares an inline `createBrowserRouter` array with no `errorElement`, no `*`/404
route, and no layout route (the only `<Outlet/>` is the auth-feature `ProtectedRoute`). The only error
boundary is the feature-scoped `AuthErrorBoundary`; everything outside the auth form is boundary-less
and whites out on a throw; caught errors are dropped in production.

The design introduces five layers, each in its reserved slot, each individually testable:

- **`src/providers/`** — `AppProviders`, the single composition root, composing
  `StyledEngineProvider injectFirst` → `ThemeProvider` → `CssBaseline` → `I18nextProvider` →
  `Suspense` around `children` (FR1). `index.tsx` shrinks to mount only the root boundary + providers
  - App (FR2).
- **`src/routes/`** — `routes.tsx` (the `createBrowserRouter` config, restructured as a `RootLayout`
  layout route with an `errorElement`, the existing `/`/`/sign-up`/`/sign-in` routes, and a catch-all
  `{ path: '*' }` 404), `route-paths.ts` (typed path constants), and a barrel (FR3-FR7). `app.tsx`
  becomes a thin `<RouterProvider>` host (FR3).
- **`src/components/layouts/`** — `RootLayout` (the layout route that owns the relocated `dir` side
  effect + `<Outlet/>`, hosting the route `errorElement`) and `AppLayout` (the authenticated app-chrome
  layout wrapping the protected `/` area) (FR7, FR14).
- **`src/components/error-boundary/`** — `AppErrorBoundary` (a feature-agnostic class boundary) +
  `ErrorFallback` (a **provider-independent** recovery UI) + `RouteError` (a thin
  `useRouteError`→`ErrorFallback` bridge for the route `errorElement`) (FR8, FR9).
- **`src/components/not-found/`** + **`src/services/error-reporting/`** — the accessible 404 page
  (FR6) and the `ErrorReporter` interface + import-light `NoopErrorReporter` seam (FR10, FR11).

The load-bearing constraint is the **auth Lighthouse budget** (NFR2). `src/config/dependency-injection-config.ts`
statically imports tsyringe + reflect-metadata + Apollo + zod; the auth pages keep that out of their
paint chunk via the deferred-DI composition root (`stores/index.ts`). The new root boundary wraps the
auth pages, so it MUST NOT statically import that container. Per **PRD D1 (recommended)**, the
`ErrorReporter` is an injectable interface with an import-light `NoopErrorReporter` **injected at the
composition root** (a default module-singleton consumed as a prop), so the boundary never imports the
heavy container; an `ErrorReporter` token is still added to `tokens.ts` and registered in the container
so the future Sentry adapter has a DI path. This is enforced structurally **and** by a new
dependency-cruiser edge forbidding `src/components`/`src/providers`/`src/routes` from importing
`dependency-injection-config` (FR12).

```text
BEFORE (main)                                  AFTER (this design)
src/index.tsx                                  src/index.tsx (thin)
  <StrictMode>                                   <StrictMode>
    <StyledEngineProvider injectFirst>             <AppErrorBoundary>            (FR8, root backstop)
      <ThemeProvider>                                <AppProviders>             (FR1, one root)
        <CssBaseline/>                                 <App/>                   (FR2)
        <Suspense><App/></Suspense>                  </AppProviders>
                                                   </AppErrorBoundary>
                                                 </StrictMode>
src/app.tsx                                     src/app.tsx (thin)
  createBrowserRouter([                           <RouterProvider router={router}/>   (FR3)
    ProtectedRoute -> '/' ButtonExample,
    '/sign-up' -> <SignUp/>,                     src/routes/routes.tsx           (FR3-FR7)
    '/sign-in' -> <SignIn/>,                       [{ element:<RootLayout/>, errorElement:<RouteError/>,
  ])  (no errorElement/404/layout)                    children:[
  dir effect in App; lang commented                   ProtectedRoute -> <AppLayout/> -> '/' ButtonExample,
  button-example.tsx also sets dir                     '/sign-up' -> <SignUp/>, '/sign-in' -> <SignIn/>,
                                                        { path:'*', element:<NotFound/> } ]}]   (FR6)
  AuthErrorBoundary wraps only the form         dir effect lives once in RootLayout; lang still commented (FR14, D3)
                                                AuthErrorBoundary unchanged (FR13)
```

No new runtime dependency lands. i18n stays a side-effect-initialized singleton (`src/i18n.js`),
now **also** composed through an explicit `<I18nextProvider i18n={i18n}>` in `AppProviders` (the issue's
intent) — `useTranslation()` behavior is unchanged, so the auth pages and existing tests are
unaffected (NFR1). The root `ErrorFallback` deliberately **breaks** from the `AuthErrorBoundary`
pattern on provider dependence: it uses **no** `useTheme`/`useTranslation`/Emotion runtime and renders
with inline static styles + hardcoded baseline copy, because the providers may be exactly what failed
(AR13/AR14). It **mirrors** `AuthErrorBoundary` on markup: scoped `role="alert"`, a native
`<button type="button">` reset, and gated dev-only `<details>` diagnostics (AR1, AR7, AR18).

## Component-Level Design

### `ErrorReporter` seam (NEW) — interface + import-light default

**Locations:** `src/services/error-reporting/types/error-reporter/index.ts` (type-only interface),
`src/services/error-reporting/error-reporter.ts` (`NoopErrorReporter` class),
`src/services/error-reporting/index.ts` (barrel + default singleton),
`src/config/tokens.ts` + `src/config/dependency-injection-config.ts` (token + registration). Implements
**FR10, FR11, NFR6, NFR7; D1, D5.**

```text
// types/error-reporter/index.ts  (type-only, #88)
export interface ErrorReporter {
  report(error: Error, context?: Record<string, unknown>): void;
}

// error-reporter.ts  (#100: injectable class, instance method, no static/free fn)
@injectable()
export class NoopErrorReporter implements ErrorReporter {
  public report(): void {
    /* default: no-op; a Sentry adapter replaces this later via DI / a lazy-loaded swap */
  }
}

// index.ts (barrel): export the class + a module-singleton default (import-light)
const noopErrorReporter = new NoopErrorReporter();
export default noopErrorReporter;        // the boundary's default reporter prop
export { NoopErrorReporter };
```

- The module is **standalone and import-light**: it imports only `tsyringe`'s `injectable` (decorator)
  and the type — **no** Apollo, zod, or other service. It is therefore safe in the paint path (NFR2),
  unlike `dependency-injection-config.ts`.
- A `TOKENS.ErrorReporter` symbol is added to `tokens.ts` (dependency-free, ~0 bytes), and
  `dependency-injection-config.ts` registers `container.registerSingleton(TOKENS.ErrorReporter,
NoopErrorReporter)` — so "wired through the existing container" is literally satisfied for any future
  consumer that resolves it, while the boundary itself uses the import-light default prop (D1-A). The
  module-singleton (`export default new NoopErrorReporter()`) follows the repo's existing
  module-singleton idiom (`auth-var.ts`, `tokens.ts`), so no DI is pulled into the boundary's chunk.
- The reporter does **not** delegate to the existing `ErrorHandler` service for #104 (D5):
  `ErrorHandler` is resolved via the heavy container and would reintroduce the budget problem.

### `AppErrorBoundary` (NEW) — root, feature-agnostic class boundary

**Location:** `src/components/error-boundary/app-error-boundary.tsx` (+ `index.ts` barrel; types in
`src/components/types/error-boundary/index.ts`). Implements **FR8, FR9, FR10, FR13; AR1, AR5, AR6,
AR18.**

Mirrors the `AuthErrorBoundary` class shape (`getDerivedStateFromError` → `{ hasError, error }`;
`handleReset` arrow field clearing state) but is feature-agnostic and reporter-driven:

```text
class AppErrorBoundary extends React.Component<AppErrorBoundaryProps, AppErrorBoundaryState> {
  static getDerivedStateFromError(error: Error) { return { hasError: true, error }; }
  componentDidCatch(error: Error, info: React.ErrorInfo) {
    this.props.reporter.report(error, { componentStack: info.componentStack });   // FR10
    // dev/test-only console (mirror shouldShowErrorDetails gating); never in production
  }
  handleReset = () => this.setState({ hasError: false, error: undefined });        // FR9 / AR6
  render() {
    return this.state.hasError
      ? <ErrorFallback error={this.state.error} reset={this.handleReset} />
      : this.props.children;
  }
}
```

- **Props** (`AppErrorBoundaryProps`, type-only): `{ children: ReactNode; reporter?: ErrorReporter }`
  with `reporter` defaulting to the import-light `noopErrorReporter` singleton — so `index.tsx` mounts
  `<AppErrorBoundary>` with no wiring, and tests inject a **mock reporter** to assert
  `report(error, info)` is called (AC7). `AppErrorBoundaryState` (type-only): `{ hasError: boolean;
error?: Error }`.
- **Imports nothing from `@auth/*` or `src/modules/**`** and uses **no** `auth.\*`i18n keys (FR8); it
imports only React,`ErrorFallback`, and the `ErrorReporter`type + default singleton — enforced by`no-components-import-modules`and the new`no-shell-to-di-config` rule (FR12, AC8).
- Placement (`index.tsx`): **outermost**, above `AppProviders`, so it catches errors thrown by the
  providers themselves (theme/i18n/router) — which is exactly why its fallback must be
  provider-independent (AR13).

### `ErrorFallback` (NEW) — provider-independent recovery UI

**Location:** `src/components/error-boundary/error-fallback.tsx` (props in
`src/components/types/error-boundary/index.ts`). Implements **FR9; AR1, AR3, AR5, AR6, AR7, AR8, AR11,
AR12, AR13, AR14, AR16, AR17, AR18.**

```text
function ErrorFallback({ error, reset }: ErrorFallbackProps): JSX.Element {
  const headingRef = useRef<HTMLHeadingElement>(null);
  useEffect(() => { headingRef.current?.focus(); }, []);   // AR5 (DOM-ref, no provider hook)
  return (
    <main lang="en" style={STATIC_FALLBACK_STYLE}>          // AR13/AR14/AR17 inline static styles
      <div role="alert" aria-atomic="true">                 // AR1 scoped assertive region
        <h1 ref={headingRef} tabIndex={-1} style={STATIC_HEADING_STYLE}>{BASELINE_TITLE}</h1>
        <p>{BASELINE_DESCRIPTION}</p>
      </div>
      <button type="button" onClick={reset} style={STATIC_BUTTON_STYLE}>{BASELINE_RETRY}</button>
      {shouldShowErrorDetails(error) && <ErrorDetails error={error} />}   // AR18 outside the alert
    </main>
  );
}
```

- **Provider-independent (AR13).** No `useTheme`, no `styled`/Emotion, no `useTranslation`. Layout,
  contrast (AR11: a named ≥4.5:1 foreground/background pair as static constants), and the focus ring
  (AR8: a static `outline` ≥3:1, not a theme token) are inline so the fallback renders even if MUI/i18n
  are the failure. Copy is **hardcoded baseline** constants (the deliberate NFR9 exception); `lang="en"`
  is set on the fallback subtree for AR14 consistency until the `lang` reinstatement lands (D-C/D3).
- **Live region scoped to the message (AR1, AR18).** `role="alert"` (implying assertive `aria-live` +
  `aria-atomic`) wraps only the heading + description; the reset button and dev diagnostics live
  **outside** it so they are not announced. Focus moves to the `<h1>` on mount via a DOM ref (AR5)
  because a boundary that catches during initial render has nothing for the live region to interrupt.
- **Keyboard + reset (AR6, AR7).** A native `<button type="button">` reset calls `reset()`; after reset
  the recovered tree restores focus to its `<main>`/`<h1>` (deterministic landing, AR6). No keyboard
  trap, no positive `tabindex`.
- **Dev-only diagnostics (AR18).** `shouldShowErrorDetails(error)` (a type-guard mirroring
  `AuthErrorBoundary`, gated to `NODE_ENV` development/test, never production) renders a native
  `<details>/<summary>/<pre>` of `error.message` only — outside the alert subtree.
- **No animation (AR16)** and **no asset-dependent imagery (AR15)** in the degraded path.
- `ErrorFallbackProps` (type-only): `{ error?: Error; reset?: () => void }`.

### `RouteError` (NEW) — route `errorElement` bridge

**Location:** `src/components/error-boundary/route-error.tsx`. Implements **FR5; AR1-AR18 (reused).**

A thin component used as the route `errorElement`: it calls `useRouteError()` (react-router) and
renders `<ErrorFallback error={normalize(routeError)} />`. It is the **route-level** error surface
(react-router catches loader/render errors within the routed tree); `AppErrorBoundary` is the
**app-level** backstop (React catches everything, including providers). Because a route error occurs
in the healthy provider tree, `RouteError` MAY supply a reset that re-navigates; for #104 it reuses
`ErrorFallback` so the recovery UX is consistent. (`useRouteError` returns `unknown`; `normalize`
coerces to an `Error` for `ErrorFallback`.)

### `AppProviders` (NEW) — provider composition root

**Location:** `src/providers/app-providers.tsx` (+ `src/providers/index.ts` barrel; props in
`src/providers/types/app-providers/index.ts`). Implements **FR1; NFR1.**

```text
function AppProviders({ children }: AppProvidersProps): JSX.Element {
  return (
    <StyledEngineProvider injectFirst>          // order preserved from index.tsx:23-31 (NFR1)
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <I18nextProvider i18n={i18n}>           // NEW explicit provider (issue intent); same singleton
          <React.Suspense fallback={null}>{children}</React.Suspense>
        </I18nextProvider>
      </ThemeProvider>
    </StyledEngineProvider>
  );
}
```

- The exact provider order (`injectFirst`, `CssBaseline` before children) is preserved so the MUI/
  Emotion cascade is unchanged (NFR1, Risk R2). `i18n` is the existing singleton from `src/i18n`
  (eager side-effect init untouched); wrapping it in `<I18nextProvider>` is behavior-equivalent to the
  current default-instance binding, so `useTranslation()` callers and tests are unaffected.
- The `Suspense` here is the single route-loading boundary that replaces the two nested
  `fallback={null}` Suspense boundaries (`index.tsx:27`, `app.tsx:46`). `AppProviders` imports only
  MUI, `react-i18next`, the theme, and the i18n singleton — **never** the DI container (NFR2, FR12).
- `AppProvidersProps` (type-only): `{ children: ReactNode }`.

### `RootLayout` (NEW) — root layout route + relocated chrome side effect

**Location:** `src/components/layouts/root-layout.tsx`. Implements **FR7, FR14; AR2 (route changes),
D3.**

The outermost layout route element. It owns the `dir` side effect relocated **verbatim** from
`app.tsx:36-44` (sync `document.documentElement.dir` from `i18n.dir(i18n.language)` on mount +
`languageChanged`, cleanup via `i18n.off`), keeps the `lang` line **commented** (D3 — no Firefox
baseline regen), and renders `<Suspense fallback={null}><Outlet/></Suspense>` so route chrome stays
mounted while a lazy child loads:

```text
function RootLayout(): JSX.Element {
  const { i18n } = useTranslation();
  useEffect(() => {
    const apply = () => { document.documentElement.dir = i18n.dir?.(i18n.language) || 'ltr';
      /* document.documentElement.lang = i18n.language;  // deferred: Firefox visual baselines (D3) */ };
    apply(); i18n.on?.('languageChanged', apply);
    return () => i18n.off?.('languageChanged', apply);
  }, [i18n]);
  return <Suspense fallback={null}><Outlet /></Suspense>;
}
```

- Being the outermost layout route, `RootLayout` applies `dir` for **every** route (home, auth, 404),
  consolidating the side effect to one place (FR14). The duplicate in `button-example.tsx:11-13` is
  removed; `app.tsx`'s effect is removed when `app.tsx` is gutted (Story 1.9).
- `RootLayout` takes no props (it renders `<Outlet/>`), so it needs no type file. It is the route whose
  `errorElement` is `<RouteError/>` (FR5).

### `AppLayout` (NEW) — authenticated app-chrome layout

**Location:** `src/components/layouts/app-layout.tsx`. Implements **FR7.**

The representative authenticated-area layout. It wraps the protected `/` area (rendered under
`ProtectedRoute`) and renders a minimal `<Outlet/>`-based chrome (a `<main>` landmark placeholder; no
nav menu — that is future work). It demonstrates the layout-route pattern future pages adopt without
re-implementing chrome. Takes no props. (`ButtonExample` remains the representative home child.)

### `route-paths.ts` (NEW) — typed path constants

**Location:** `src/routes/route-paths.ts`. Implements **FR4; D6.**

```text
export const ROUTE_PATHS = {
  home: '/', signUp: '/sign-up', signIn: '/sign-in', notFound: '*',
} as const;
```

- A frozen-style `as const` object (an object literal, **not** a function — compliant with the #100
  no-free-function gate, like `tokens.ts`); imported by `routes.tsx`. Whether `ProtectedRoute` adopts
  `ROUTE_PATHS.signIn` for its `<Navigate to="/sign-in">` is **D6** (depends on whether a feature may
  import the `src/routes` shell layer under the new dependency-cruiser rules; if not, keep the literal +
  a consistency test).

### `routes.tsx` (NEW) — the router config

**Location:** `src/routes/routes.tsx` (+ `src/routes/index.ts` barrel). Implements **FR3, FR5, FR6,
FR7.**

```text
export const router = createBrowserRouter([
  {
    element: <RootLayout />,
    errorElement: <RouteError />,                                   // FR5
    children: [
      { element: <ProtectedRoute />, children: [
          { element: <AppLayout />, children: [
              { path: ROUTE_PATHS.home, element: <ButtonExample /> } ] } ] },   // FR7
      { path: ROUTE_PATHS.signUp, element: <SignUp /> },
      { path: ROUTE_PATHS.signIn, element: <SignIn /> },
      { path: ROUTE_PATHS.notFound, element: <NotFound /> },        // FR6 catch-all
    ],
  },
], { future: { v7_startTransition: true } });
```

- `SignUp`/`SignIn`/`ButtonExample` stay `React.lazy` route-level chunks (preserving the current
  splitting + the auth budget); `RootLayout`/`AppLayout`/`NotFound`/`RouteError` are eager (chrome
  paints immediately). The `future` flag is preserved from `app.tsx:47`. The barrel re-exports `router`
  so `app.tsx` imports `{ router } from '@/routes'`.
- Note: `routes.tsx` imports `@auth/components/protected-route` and `@auth/routes/sign-up|sign-in`.
  `ProtectedRoute`, `SignUp`, `SignIn` are feature **public-API** route entries (under
  `@auth/.../routes`/`components`), already imported by today's `app.tsx`. The new dependency-cruiser
  rule forbids `src/routes` from importing feature **internals** (`^src/modules/[^/]+/features/.../`
  deep files); importing the established public route/component entries mirrors today's `app.tsx` and is
  the intended seam (see Gate-Compliance Notes + D6).

### `NotFound` 404 page (NEW)

**Location:** `src/components/not-found/not-found.tsx` (+ `src/components/not-found/i18n/{en,uk}.json`).
Implements **FR6; AR2, AR3, AR4, AR7, AR9, AR10, AR15, AR17.**

A normal routed page in the **healthy** tree, so it MAY use i18n/theme:

```text
function NotFound(): JSX.Element {
  usePageTitleLike('not_found.title');                  // AR4 descriptive document.title
  const { t } = useTranslation();
  return (
    <>
      <UIBackToMain />                                   // reused chrome (AR10 fix applied — see below)
      <Box component="main">                             // AR17 landmark
        <UITypography component="h1" variant="h4">{t('not_found.title')}</UITypography>  // AR3 one h1
        <UITypography>{t('not_found.description')}</UITypography>
        <UIButton to={ROUTE_PATHS.home}>{t('not_found.cta')}</UIButton>   // AR9 descriptive link
      </Box>
      <UIFooter />
    </>
  );
}
```

- **No `role="alert"`** (AR2) — a 404 is not an error event; it conveys "not found" via the visible
  `<h1>` and `document.title`. Reuses the shared `UIBackToMain` + `UIFooter` chrome (D4-A); since
  `UIBackToMain`'s hardcoded `aria-label="Back"` overrides its visible localized label (a pre-existing
  WCAG 2.5.3 + i18n defect), this story **fixes it deliberately** (drop/localize the redundant
  `aria-label`) rather than inheriting it (AR10, D-F, Risk R9).
- i18n keys live under a unique top-level `not_found` namespace in a co-located `i18n/{en,uk}.json`
  folder (auto-merged by `scripts/localization-generator.js`; both locales present to avoid the
  missing-locale warning; no collision with existing keys) (NFR9). The `document.title` is set via the
  same pattern as the auth `usePageTitle` (reused or a small shell-local equivalent).

### `index.tsx` (MODIFY) — slim mount

**File:** `src/index.tsx`. Implements **FR2; NFR2.**

```text
root.render(
  <React.StrictMode>
    <AppErrorBoundary>            {/* default reporter = noopErrorReporter (import-light) */}
      <AppProviders>
        <App />
      </AppProviders>
    </AppErrorBoundary>
  </React.StrictMode>
);
```

- `reflect-metadata` stays the **first** import (`index.tsx:1`); the eager `import i18n from './i18n'`
  stays so `i18n.t('root_element_missing')` (`index.tsx:17`) still works before render. The provider
  pyramid (`index.tsx:23-31`) and the inner `Suspense` move into `AppProviders`. `index.tsx` imports
  `AppErrorBoundary` and `AppProviders` — **never** the DI container (NFR2). `index.tsx` is
  coverage-excluded (`jest.config.ts`), so all coverage-bearing logic lives in the imported modules
  (NFR10).

### `app.tsx` (MODIFY) — thin RouterProvider host

**File:** `src/app.tsx`. Implements **FR3, FR14.**

```text
import { router } from '@/routes';
function App(): React.ReactElement { return <RouterProvider router={router} />; }
export default App;
```

- The inline `createBrowserRouter` array, the lazy route imports, the `dir` effect (relocated to
  `RootLayout`), and the second `Suspense` are all removed. The `future` flag moves into
  `createBrowserRouter` in `routes.tsx`. `tests/unit/app.test.tsx` is updated to the new thin host
  (mock `@/routes` `router`, assert `RouterProvider` renders it).

### `button-example.tsx` (MODIFY) — drop duplicate side effect

**File:** `src/button-example.tsx`. Implements **FR14.**

Remove the `document.documentElement.dir` `useEffect` (`button-example.tsx:11-13`) and the now-unused
`i18n` import; `dir` is owned solely by `RootLayout`. The component otherwise stays the representative
home `/` element. Its unit test is updated to assert no `dir` side effect.

## File-by-File Change Plan

Every `src`, test, and config file added / modified. `specs/**` is lint-excluded; the two housekeeping
files are listed because the epics reference them and the loop applies them.

| Path                                                               | Change                                                                                                                                                                                                |
| ------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/services/error-reporting/types/error-reporter/index.ts`       | **New (type-only).** `ErrorReporter` interface (`report(error, context?)`). (FR10, NFR7)                                                                                                              |
| `src/services/error-reporting/error-reporter.ts`                   | **New.** `@injectable() NoopErrorReporter implements ErrorReporter` — import-light (no Apollo/zod). (FR11, NFR6, NFR2)                                                                                |
| `src/services/error-reporting/index.ts`                            | **New.** Barrel: re-export `NoopErrorReporter` + default module-singleton `noopErrorReporter`. (FR11)                                                                                                 |
| `src/config/tokens.ts`                                             | **Modify.** Add `ErrorReporter: Symbol('ErrorReporter')` to the frozen `TOKENS`. (FR11)                                                                                                               |
| `src/config/dependency-injection-config.ts`                        | **Modify.** `container.registerSingleton(TOKENS.ErrorReporter, NoopErrorReporter)` — DI path for the future adapter; the boundary does NOT resolve from here (D1). (FR11)                             |
| `src/components/types/error-boundary/index.ts`                     | **New (type-only).** `AppErrorBoundaryProps { children; reporter? }`, `AppErrorBoundaryState { hasError; error? }`, `ErrorFallbackProps { error?; reset? }`. (NFR7)                                   |
| `src/components/error-boundary/error-fallback.tsx`                 | **New.** Provider-independent recovery UI: scoped `role="alert"`, focus-on-mount, native reset, dev-only `<details>`, inline static styles + hardcoded copy. (FR9, AR1/AR5-AR18)                      |
| `src/components/error-boundary/app-error-boundary.tsx`             | **New.** Root class boundary (`getDerivedStateFromError`/`componentDidCatch`/`handleReset`) → `ErrorFallback`; calls `reporter.report`; default reporter = singleton. Feature-agnostic. (FR8-FR10)    |
| `src/components/error-boundary/route-error.tsx`                    | **New.** `useRouteError()`→`<ErrorFallback/>` bridge for the route `errorElement`. (FR5)                                                                                                              |
| `src/components/error-boundary/index.ts`                           | **New.** Barrel: `AppErrorBoundary`, `ErrorFallback`, `RouteError`.                                                                                                                                   |
| `src/providers/types/app-providers/index.ts`                       | **New (type-only).** `AppProvidersProps { children: ReactNode }`. (NFR7)                                                                                                                              |
| `src/providers/app-providers.tsx`                                  | **New.** Composition root: `StyledEngineProvider injectFirst`→`ThemeProvider`→`CssBaseline`→`I18nextProvider`→`Suspense`. (FR1, NFR1)                                                                 |
| `src/providers/index.ts`                                           | **New.** Barrel: `AppProviders`.                                                                                                                                                                      |
| `src/components/layouts/root-layout.tsx`                           | **New.** Root layout route: relocated `dir` effect (lang commented, D3) + `<Suspense><Outlet/></Suspense>`. (FR7, FR14)                                                                               |
| `src/components/layouts/app-layout.tsx`                            | **New.** Authenticated app-chrome layout wrapping the protected `/` area via `<Outlet/>`. (FR7)                                                                                                       |
| `src/components/not-found/i18n/en.json`                            | **New.** `not_found.{title,description,cta}` (English). (FR6, NFR9)                                                                                                                                   |
| `src/components/not-found/i18n/uk.json`                            | **New.** `not_found.*` (Ukrainian) — parity. (NFR9)                                                                                                                                                   |
| `src/components/not-found/not-found.tsx`                           | **New.** Accessible 404 page (one `<h1>`, `<main>`, descriptive title + CTA, no `role="alert"`, reused chrome with the AR10 fix). (FR6, AR2-AR17)                                                     |
| `src/routes/route-paths.ts`                                        | **New.** `ROUTE_PATHS` typed `as const` constants (`home`/`signUp`/`signIn`/`notFound`). (FR4)                                                                                                        |
| `src/routes/routes.tsx`                                            | **New.** `createBrowserRouter`: `RootLayout` layout route + `errorElement` + `ProtectedRoute`→`AppLayout`→`/` + `/sign-up` + `/sign-in` + `*`→`NotFound`; `future` flag. (FR3-FR7)                    |
| `src/routes/index.ts`                                              | **New.** Barrel: `router`, `ROUTE_PATHS`.                                                                                                                                                             |
| `src/index.tsx`                                                    | **Modify.** Mount `<StrictMode><AppErrorBoundary><AppProviders><App/></AppProviders></AppErrorBoundary></StrictMode>`; remove the provider pyramid; keep `reflect-metadata` first + eager i18n. (FR2) |
| `src/app.tsx`                                                      | **Modify.** Thin `<RouterProvider router={router}/>` host (import from `@/routes`); remove inline routes, lazy imports, the `dir` effect, and the 2nd `Suspense`. (FR3, FR14)                         |
| `src/button-example.tsx`                                           | **Modify.** Remove the duplicate `document.documentElement.dir` effect (`:11-13`) + unused `i18n` import. (FR14)                                                                                      |
| `.dependency-cruiser.js`                                           | **Modify.** Add `no-providers-import-feature-internals`, `no-routes-import-feature-internals`, and `no-shell-to-di-config` (error severity); keep `no-components-import-modules` intact. (FR12)       |
| `tests/unit/services/error-reporting/error-reporter.test.ts`       | **New.** `NoopErrorReporter.report()` is callable/no-throw; default singleton exported; token registered. (AC7, NFR10)                                                                                |
| `tests/unit/components/error-boundary/error-fallback.test.tsx`     | **New.** Degraded render (NO providers) shows hardcoded copy + focusable reset + focus-on-mount + scoped `role="alert"`; dev-only `<details>` gating. (AC5, AC9)                                      |
| `tests/unit/components/error-boundary/app-error-boundary.test.tsx` | **New.** Throwing child → fallback; reset recovers; injected **mock reporter** receives the error; dev console gating. (AC5, AC6, AC7)                                                                |
| `tests/unit/components/error-boundary/route-error.test.tsx`        | **New.** Renders `ErrorFallback` from a simulated `useRouteError`. (AC4, NFR10)                                                                                                                       |
| `tests/unit/providers/app-providers.test.tsx`                      | **New.** Children render with theme + i18n + CssBaseline in effect; provider order. (AC1)                                                                                                             |
| `tests/unit/components/layouts/root-layout.test.tsx`               | **New.** `dir` set on mount + `languageChanged`; `lang` NOT set (D3); `<Outlet/>` child renders. (AC11)                                                                                               |
| `tests/unit/components/layouts/app-layout.test.tsx`                | **New.** Renders the `<Outlet/>` child inside the app chrome/`<main>`. (AC4)                                                                                                                          |
| `tests/unit/components/not-found/not-found.test.tsx`               | **New.** One `getByRole('heading', { level: 1 })`, `<main>`, descriptive `document.title`, descriptive CTA link, NO `role="alert"`; reused chrome with corrected accessible name. (AC3)               |
| `tests/unit/routes/route-paths.test.ts`                            | **New.** Exact constant values (mutation-hardened). (AC2, NFR12)                                                                                                                                      |
| `tests/unit/routes/routes.test.tsx`                                | **New.** `createMemoryRouter` resolves `/`, `/sign-up`, `/sign-in`; unknown path → `NotFound`; root route has an `errorElement`; pages render through `RootLayout`/`AppLayout` outlets. (AC2-AC4)     |
| `tests/unit/app.test.tsx`                                          | **Modify.** Update to the thin host: mock `@/routes` `router`, assert `RouterProvider` renders it; drop the inline-route + `dir` assertions (now in `routes.test.tsx`/`root-layout.test.tsx`). (AC2)  |
| `tests/unit/button-example.test.tsx`                               | **Modify (if present).** Assert no `dir` side effect remains. (AC11)                                                                                                                                  |
| `tests/unit/config/dependency-injection-config.test.ts`            | **Modify.** Assert `TOKENS.ErrorReporter` resolves to a `NoopErrorReporter`. (AC7)                                                                                                                    |
| `_bmad/config.yaml`                                                | **Modify (housekeeping).** Point `planning_artifacts`/`implementation_artifacts` at `specs/enterprise-app-shell/...`. Applied by the loop.                                                            |
| `specs/README.md`                                                  | **Modify (housekeeping).** Add an `enterprise-app-shell` row to the Current Specs table. Applied by the loop.                                                                                         |

## Gate-Compliance Notes

- **rca per-file ≤10 functions + size caps (NFR3).** Each concern is its own small file: the boundary,
  the fallback, the route-error bridge, each layout, `AppProviders`, `routes.tsx`, `route-paths.ts`,
  and the reporter are separate. The boundary class keeps a minimal public surface (≤8 public methods:
  `getDerivedStateFromError`, `componentDidCatch`, `handleReset`, `render`) and ≤2 public attributes;
  the `ErrorFallback`'s `<details>` helper (`ErrorDetails`) + the `shouldShowErrorDetails` type-guard
  may move to a co-located file if `error-fallback.tsx` nears the 10-function cap. All files stay under
  LLOC ≤120 / SLOC ≤350.
- **jscpd DRY → no fallback clone (NFR4).** The root `ErrorFallback` is deliberately different from
  `AuthErrorBoundary`'s fallback (provider-independent, inline styles, hardcoded copy), so the two do
  **not** form a ≥75-token clone. If a shared fragment (e.g. the `<details>` diagnostics or the
  type-guard) would clone ≥75 tokens, it is extracted into a shared helper consumed by both — never
  suppressed.
- **Auth Lighthouse budget → no heavy import in the shell (NFR2, FR12).** `index.tsx`,
  `AppErrorBoundary`, `ErrorFallback`, `AppProviders`, `RootLayout`, `routes.tsx`, and the default
  `ErrorReporter` import only React/MUI/react-i18next/the import-light reporter — **never**
  `src/config/dependency-injection-config.ts` (tsyringe + Apollo + zod). The new `no-shell-to-di-config`
  dependency-cruiser rule machine-enforces this; an import-graph/chunk test (AC12) backs it. The
  `NoopErrorReporter` imports only `tsyringe`'s `injectable` decorator (already in the bootstrap chunk
  via `reflect-metadata`), not the container.
- **dependency-cruiser house style (FR12).** New rules follow the existing `{ name, comment, severity:
'error', from, to }` shape and the feature-internals path idiom
  (`to.path: '^src/modules/[^/]+/features/'`), mirroring `no-cross-feature-imports`
  (`.dependency-cruiser.js:346-357`). `no-shell-to-di-config` forbids
  `from: { path: ['^src/components/', '^src/providers/', '^src/routes/'] }` →
  `to: { path: '^src/config/dependency-injection-config' }`. The existing
  `no-components-import-modules` (`:230-239`) and the composition-root DI-config rule (`:326-344`) stay
  intact; the new providers/routes rules are narrower additions. The route layer's imports of the auth
  **public** route entries (`@auth/.../routes/sign-up|sign-in`, `@auth/components/protected-route`) are
  the same imports today's `app.tsx` makes; the new rule targets feature **internals** (deep files), not
  these public entries — confirm the regex permits the established public-API paths (mirror the
  `no-repository-internal-imports` negative-lookahead idiom if needed).
- **ESLint #100 / #88 / #90.** The `ErrorReporter` default is an `@injectable` class with an instance
  `report()` (no `static`, no free functions); `route-paths.ts` and `tokens.ts` are object-literal
  consts (not functions), compliant. All prop/contract types live in type-only `types/` files imported
  via `import type` (#88). No `data-testid` in `src/**`; the 404/fallback are located by role/heading/
  text (#90). `.tsx` components and the class boundary are exempt from #100.
- **i18n parity (NFR9).** `not_found.*` ships in both `en.json` and `uk.json` under a unique top-level
  namespace, merged by `scripts/localization-generator.js` into `localization.json`. The root
  fallback's hardcoded baseline copy is the documented exception (it must render without i18n).
- **Coverage (NFR10).** `src/index.tsx` is coverage-excluded, so its thin mount carries no coverage
  burden; every other new file is fully covered by positive/negative/edge tests (degraded fallback,
  reset, reporter, route resolution, 404, dir effect, both layout outlets).
- **commitlint / squash-merge (NFR13).** Commit headers ≤100 chars with a `(#104)` scope; `Closes #104`
  rides the squash message (squash-merge-only; bots rewrite the PR body).

## Test Strategy

- **Unit (Jest, jsdom).**
  - **Error-reporting:** `NoopErrorReporter.report()` is callable and never throws; the default
    singleton is exported; the DI container resolves `TOKENS.ErrorReporter` to a `NoopErrorReporter`
    (AC7).
  - **Root boundary + fallback:** a throwing child renders the fallback (`role="alert"` scoped to the
    message; focus on the `<h1>`; native reset); activating reset recovers the children with
    deterministic focus; an **injected mock reporter** receives `report(error, info)`; dev console is
    gated to non-production. The fallback renders correctly with **no** `ThemeProvider`/
    `I18nextProvider` (degraded path) showing the hardcoded copy + contrast-safe static style (AC5, AC6,
    AC7, AC9). Exact `role`/string assertions (NFR12).
  - **Providers:** children render with theme + i18n + CssBaseline in effect; provider order preserved
    (AC1).
  - **Routes:** `createMemoryRouter(router, { initialEntries: [path] })` resolves `/`, `/sign-up`,
    `/sign-in`; an unknown path renders `NotFound`; the root route exposes an `errorElement`; pages
    render through the `RootLayout`/`AppLayout` outlets (AC2-AC4). `route-paths.ts` exact values
    (NFR12). Follow the `tests/unit/app.test.tsx` mocking idiom (mock `react-router-dom` /
    `createMemoryRouter`).
  - **Layouts:** `RootLayout` sets `dir` on mount + `languageChanged`, does NOT set `lang` (D3), and
    renders its `<Outlet/>` child; `AppLayout` renders its outlet child inside the app `<main>` (AC4,
    AC11).
  - **404:** one `<h1>`, `<main>` landmark, descriptive `document.title`, descriptive CTA link, **no**
    `role="alert"`; the reused `UIBackToMain` exposes its corrected localized accessible name (AC3,
    AR10).
  - **Thin hosts:** `app.test.tsx` updated to assert `RouterProvider` renders the imported `router`;
    `button-example` asserts no `dir` effect (AC2, AC11).
- **Integration (Jest, 100% over `src/**`).** Every new file is covered by the unit/integration render
paths so the global 100% gate holds; `src/index.tsx` stays coverage-excluded (AC14, NFR10).
- **dependency-cruiser (`make lint-deps`).** The new rules report **zero** violations; a deliberate
  probe (in review, not committed source) confirms an import from `src/components`/`src/providers`/
  `src/routes` into a feature internal or into `dependency-injection-config` is flagged `error` (AC8).
- **Import-graph / budget (AC12).** A test (or the dependency-cruiser edge) confirms the shell entry
  path does not statically import `dependency-injection-config`; the auth pages' paint chunk stays free
  of tsyringe/Apollo/zod (NFR2).
- **Lighthouse (CI).** The mobile gate on `/sign-up`/`/sign-in` stays ≥0.85; the shell additions add no
  paint-path JS to those pages (NFR2). No `lighthouse/constants.js` change is required (the audited
  pages are unchanged).
- **Mutation (Stryker).** Exact-value assertions (the `*` wildcard, the fallback `role="alert"`, the
  404 heading/title, the reporter call, the `dir` value) leave no surviving mutant on the new branches
  (NFR12, AC16).
- **Visual / e2e.** No new visual baselines or e2e specs are required for #104 (the home/auth routes
  render identically; the 404/fallback are additive and unit-covered). A follow-up MAY add an e2e
  smoke for the 404 once a designed page exists. The deferred `lang` re-enable (and its Firefox
  baseline regen) is explicitly **out of scope** (D3).

## Rollout / Sequencing

1. **Error-reporting seam.** Add the `ErrorReporter` interface (type-only), `NoopErrorReporter`
   (`@injectable`, import-light), the barrel + default singleton, the `tokens.ts` token, and the
   container registration. Unit-test the no-op + token. (Story 1.1)
2. **Root `ErrorFallback`.** Add the provider-independent fallback (scoped `role="alert"`,
   focus-on-mount, native reset, dev-only `<details>`, inline static styles + hardcoded copy) + its
   type-only props. Unit-test the degraded render. (Story 1.2)
3. **`AppErrorBoundary`.** Add the class boundary → `ErrorFallback`, calling `reporter.report`; default
   reporter = the singleton. Unit-test catch/reset/reporter. (Story 1.3, depends 1.1-1.2)
4. **`AppProviders` + slim `index.tsx`.** Move the provider pyramid into `AppProviders` (order
   preserved + `I18nextProvider`); mount `<AppErrorBoundary><AppProviders><App/>…`. App still hosts the
   inline router. Unit-test composition. (Story 1.4, depends 1.3)
5. **`route-paths.ts`.** Typed constants + test. (Story 1.5)
6. **`RootLayout`** (relocated `dir` effect, `lang` commented, `<Suspense><Outlet/></Suspense>`) +
   remove the `button-example` `dir` duplicate. Unit-test in isolation (the live app still uses
   `app.tsx`'s effect until step 9). (Story 1.6, depends 1.5)
7. **`AppLayout`.** App-chrome layout + test. (Story 1.7)
8. **`NotFound` 404** (+ `not_found` i18n en/uk, reused chrome, AR10 fix). Unit-test. (Story 1.8)
9. **Route layer + thin `app.tsx`.** Add `routes.tsx` (RootLayout layout route + `errorElement` via
   `RouteError` + ProtectedRoute→AppLayout→home + `/sign-up` + `/sign-in` + `*`→NotFound) + the barrel;
   reduce `app.tsx` to the `RouterProvider` host and **remove** its `dir` effect (now in `RootLayout`).
   Update `app.test.tsx`; add `routes.test.tsx`/`route-error.test.tsx`. (Story 1.9, depends 1.5-1.8)
10. **dependency-cruiser rules.** Add the providers/routes feature-internals rules + `no-shell-to-di-config`;
    verify zero violations; keep the existing rule intact. (Story 1.10, depends the structure existing)
11. **Gate sweep + housekeeping.** `make format` then `make lint` (eslint, tsc, `make lint-dup`,
    `make lint-metrics`), dependency-cruiser, unit + integration (100% over `src/**`), Stryker,
    Lighthouse — all green, no suppressions. Point `_bmad/config.yaml` at the new spec; add the
    `specs/README.md` row. (Story 1.11)

This sequence is internally consistent: the reporter/fallback/boundary (1-3) are self-contained;
`AppProviders` (4) works while `app.tsx` still hosts the inline router; `RootLayout` (6) is authored
and tested in isolation before being wired (9), so `dir` is never double-applied (the `app.tsx` effect
is removed only when `RootLayout` takes over); and the dependency-cruiser rules (10) land once the
shell files exist so they immediately guard real edges.

## Out-of-Scope Confirmation

Unchanged by this work: `AuthErrorBoundary` (stays feature-scoped, still wraps the auth form),
the auth store, repositories, the deferred-DI composition root and the auth Lighthouse-budget
mechanism, the component-level `AuthPageLayout` and the auth pages' visual baselines, `usePageTitle`,
and all form logic. **No** product pages, nav menus, dashboards, or auth flows are built — only the
shell scaffolding plus one representative wiring of each (home stays `ButtonExample`). **No** concrete
Sentry/observability SDK (only the interface + no-op default behind the seam) and **no** delegation to
the heavy `ErrorHandler` service (D5). **No** router `AuthLayout` route and **no** migration of the
auth pages onto one (D2). **No** re-enabling of `document.documentElement.lang` — only relocation of
the existing (commented) handling into `RootLayout` (D3); the Firefox visual-baseline regen stays the
a11y follow-up's job. **No** loosening of any existing gate (eslint, tsc, jscpd, metrics,
dependency-cruiser) — new imports are made to fit the rules, not the reverse. **No** global polite SPA
route-change announcer (D-B, follow-up). The `lighthouse/constants.js` audited pages are unchanged.
