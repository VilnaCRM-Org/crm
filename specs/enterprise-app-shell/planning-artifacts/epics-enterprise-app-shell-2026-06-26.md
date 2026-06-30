---
status: 'complete'
workflowType: 'epics'
project_name: 'crm'
date: '2026-06-26'
issue: 'https://github.com/VilnaCRM-Org/crm/issues/104'
inputDocuments:
  - 'https://github.com/VilnaCRM-Org/crm/issues/104'
  - 'specs/enterprise-app-shell/planning-artifacts/prd-enterprise-app-shell-2026-06-26.md'
  - 'specs/enterprise-app-shell/planning-artifacts/architecture-enterprise-app-shell-2026-06-26.md'
  - 'src/index.tsx'
  - 'src/app.tsx'
  - 'src/button-example.tsx'
  - 'src/i18n.js'
  - 'src/config/tokens.ts'
  - 'src/config/dependency-injection-config.ts'
  - 'src/modules/user/features/auth/components/auth-error-boundary/index.tsx'
  - 'src/modules/user/features/auth/components/protected-route/index.tsx'
  - 'src/components/ui-back-to-main/index.ts'
  - 'src/components/ui-footer/index.ts'
  - 'scripts/localization-generator.js'
  - '.dependency-cruiser.js'
  - 'eslint.config.mjs'
  - 'config/metrics-policy.json'
  - '.jscpd.json'
  - 'lighthouse/lighthouserc.mobile.js'
  - 'jest.config.ts'
  - 'tests/unit/app.test.tsx'
  - 'tests/unit/utils/render-with-providers.tsx'
  - '_bmad/config.yaml'
  - 'specs/README.md'
---

# Epics & Stories - Refactor App Shell into an Enterprise Product Shell (Issue #104)

**Author:** John (Product Manager) **Date:** 2026-06-26 **Source:** VilnaCRM-Org/crm#104

> **Status:** planning complete — awaiting owner ratification of the Open Decisions (PRD D1-D6,
> D-A-D-F) before implementation. **D1 (reporter wiring)** is the gating decision: this Epic assumes
> the recommended option **A** (an injectable `ErrorReporter` interface + import-light
> `NoopErrorReporter` injected at the composition root; the boundary never imports the heavy DI
> container). If the owner picks B/C, Story 1.1 and Story 1.3 change accordingly.

## Overview

This Epic decomposes issue #104 — turning the demo app shell into an enterprise product shell — into
**one Epic** and eleven small, vertically-sliced, dependency-ordered stories. Each story is sized to
stay under the rca gate (NFR3: ≤10 functions/closures per file, Cyclomatic ≤10, Cognitive ≤15, ABC
≤17, ≤3 args, ≤3 exit points, function LLOC ≤10 / file LLOC ≤120; an injectable class ≤8 public
methods / ≤2 public attributes) and to land a shippable slice with its own positive/negative/edge
tests at 100% coverage over `src/**` (NFR10). Stories are grounded strictly in the files confirmed
during planning: the inline provider pyramid (`src/index.tsx:22-33`), the inline router with no
`errorElement`/404/layout (`src/app.tsx:13-31`), the single feature-scoped `AuthErrorBoundary`, the
heavy `dependency-injection-config.ts` vs. the deferred-DI auth Lighthouse budget, and the
dependency-cruiser/ESLint/rca/jscpd gates.

This is **scaffolding only** (issue mandate): provider/route/layout/boundary structure plus one
representative wiring of each — **not** the 50+ pages, nav menus, or auth flows. The home `/` stays
`ButtonExample`; the auth pages keep their component-level `AuthPageLayout` (issue #31, untouched, D2);
`AuthErrorBoundary` stays feature-scoped (FR13). The single hard constraint threaded through every
story is the **auth Lighthouse budget** (NFR2): no shell file may statically import
`src/config/dependency-injection-config.ts` (tsyringe + Apollo + zod), enforced structurally (D1) and
by a new dependency-cruiser edge (Story 1.10).

Requirement IDs (FR1-FR14, NFR1-NFR14, AR1-AR18, AC1-AC16, D1-D6, D-A-D-F) are defined in the PRD and
referenced verbatim here for traceability.

## Epic 1: Refactor the app shell into an enterprise product shell with providers, routes, layouts, and a root error boundary

**Epic goal.** Replace the demo shell — the inline provider pyramid in `src/index.tsx`, the inline
router with no error/404/layout handling in `src/app.tsx`, and the absence of a root error boundary or
error-reporting sink — with named, individually testable, machine-enforced layers: a single
`AppProviders` composition root (`src/providers/`); a dedicated route layer (`src/routes/`) with typed
paths, an `errorElement`, a layout route, and a catch-all 404; `RootLayout`/`AppLayout`
(`src/components/layouts/`); a feature-agnostic root `AppErrorBoundary` with a provider-independent,
accessible, recoverable fallback (`src/components/error-boundary/`); an accessible 404 page
(`src/components/not-found/`); and an injectable `ErrorReporter` interface + no-op default
(`src/services/error-reporting/`). Keep the rendered output of `/`, `/sign-up`, `/sign-in` unchanged
(NFR1), protect the auth Lighthouse budget (NFR2), keep `AuthErrorBoundary` feature-scoped (FR13),
and enforce the new layer boundaries with dependency-cruiser — all within every existing repo gate,
with no new dependency, no suppressions, and no new inline comments.

**Epic scope.** The five new shell layers + the modified entry files (`index.tsx`, `app.tsx`,
`button-example.tsx`), the `tokens.ts`/`dependency-injection-config.ts` error-reporter wiring, the new
`not_found` i18n (en/uk), the new dependency-cruiser rules, and the full unit/integration test
coverage they require. Out of scope and unchanged: `AuthErrorBoundary`, the auth store, repositories,
the deferred-DI composition root and the budget mechanism, the auth pages' component-level
`AuthPageLayout` and their visual baselines, `usePageTitle`, all form logic, any concrete
Sentry/observability SDK, a router `AuthLayout` route (D2), re-enabling `<html lang>` (D3), the
`ErrorHandler` delegation (D5), a polite SPA route announcer (D-B), and the product pages/nav menus.

**Epic acceptance.** AC1-AC16 are all met; `make format` then `make lint` (ESLint, tsc,
`make lint-dup`, `make lint-metrics`), dependency-cruiser, unit + integration (100% over `src/**`),
Stryker mutation, and the Lighthouse CI gate (≥0.85 on `/sign-up`/`/sign-in`) all pass with no new
suppressions, no `data-testid` in `src/**`, and no new inline code comments. The commit header is
≤100 chars with a `(#104)` scope and the `Closes #104` reference rides the squash message
(squash-merge-only repo; bots rewrite the PR body).

---

### Story 1.1: Add the `ErrorReporter` seam — interface + injectable no-op default + DI token

**User story.** As an operator, I want a pluggable error-reporting seam so that a Sentry/observability
adapter can be wired later without touching boundary components, and as a developer I want it to be an
injectable class behind an interface, consistent with the repo's DI conventions.

**Description.** Add the seam under `src/services/error-reporting/` (FR10, FR11, D1-A). Type-only
interface `src/services/types/error-reporting/index.ts`:

```text
export interface ErrorReporter {
  report(error: Error, context?: Record<string, unknown>): void;
}
```

`src/services/error-reporting/noop-error-reporter.ts` — an `@injectable()` class with an instance method
(no `static`, no free functions, #100/NFR6); it is **import-light** (imports only `tsyringe`'s
`injectable` + the type — **no** Apollo/zod, so it is safe in the paint path, NFR2):

```text
@injectable()
export class NoopErrorReporter implements ErrorReporter {
  public report(): void { /* default no-op; replaced by a real adapter later via DI / lazy swap */ }
}
```

`src/services/error-reporting/index.ts` (barrel) re-exports the class and a **module-singleton**
default (`const noopErrorReporter = new NoopErrorReporter(); export default noopErrorReporter;` — the
repo's established singleton idiom, e.g. `auth-var.ts`) used as the boundary's default reporter prop.
Add `ErrorReporter: Symbol('ErrorReporter')` to the frozen `TOKENS` in `src/config/tokens.ts`
(dependency-free, ~0 bytes), and register `container.registerSingleton(TOKENS.ErrorReporter,
NoopErrorReporter)` in `src/config/dependency-injection-config.ts` so the DI path exists for the future
adapter — the boundary itself does **not** resolve from the container (D1, NFR2). The reporter does
NOT delegate to the existing `ErrorHandler` service (D5).

**Acceptance Criteria.**

- Given `NoopErrorReporter`, When `report(new Error('x'))` is called, Then it returns without throwing
  (no-op) and is exposed as an instance method on an `@injectable()` class (FR10, FR11, NFR6).
- Given the barrel, When imported, Then `NoopErrorReporter` and a default `noopErrorReporter` singleton
  are exported (FR11).
- Given the DI container, When `TOKENS.ErrorReporter` is resolved, Then it returns a `NoopErrorReporter`
  instance (FR11, AC7).
- Given the seam module, When its imports are inspected, Then it imports no Apollo/zod and not
  `dependency-injection-config.ts` (import-light, NFR2).
- Given the interface, When inspected, Then it lives in a type-only `types/` file imported via
  `import type` (NFR7), and the logic file declares no `interface`/`type`.

**Files touched.** `src/services/types/error-reporting/index.ts` (new, type-only),
`src/services/error-reporting/noop-error-reporter.ts` (new), `src/services/error-reporting/index.ts` (new),
`src/config/tokens.ts` (modify), `src/config/dependency-injection-config.ts` (modify).

**Tests to add/update.** Unit (new `tests/unit/services/error-reporting/error-reporter.test.ts`):
`report()` is callable and never throws; the default singleton is exported; assert the import-light
surface. Update `tests/unit/config/dependency-injection-config.test.ts`: `TOKENS.ErrorReporter`
resolves to a `NoopErrorReporter`. Full coverage of the new files (NFR10).

**Dependencies.** None (foundation).

**Definition of Done.** Seam + token + registration added and 100% covered; no-op + token-resolution
assertions green; `make lint-metrics`/`make lint-dup`/ESLint (no free functions, type-only)/TS/
dependency-cruiser pass; no suppression, no inline comment.

---

### Story 1.2: Add the provider-independent root `ErrorFallback`

**User story.** As any user, when something crashes I want an accessible recovery screen with a retry
button instead of a blank page — and as a keyboard/SR user I want focus moved to the message and the
screen to render even if the theme or i18n provider is what failed.

**Description.** Add `src/components/error-boundary/error-fallback.tsx` — a presentational recovery UI
that is **provider-independent** (AR13): **no** `useTheme`, `styled`/Emotion, or `useTranslation`. It
uses inline static styles (a named ≥4.5:1 foreground/background pair, AR11; a static `outline` focus
ring ≥3:1, AR8/AR12), hardcoded baseline copy (the deliberate NFR9 exception), and `lang="en"` on its
subtree for AR14 consistency (D-C/D3). Structure (FR9; AR1, AR3, AR5, AR6, AR7, AR16-AR18):

```text
function ErrorFallback({ error, reset }: ErrorFallbackProps): JSX.Element {
  const headingRef = useRef<HTMLHeadingElement>(null);
  useEffect(() => { headingRef.current?.focus(); }, []);          // AR5 DOM-ref focus, no provider hook
  return (
    <main lang="en" style={STATIC_FALLBACK_STYLE}>                // AR13/AR14/AR17
      <div role="alert" aria-atomic="true">                       // AR1 scoped assertive region
        <h1 ref={headingRef} tabIndex={-1}>{BASELINE_TITLE}</h1>  // AR3 single h1
        <p>{BASELINE_DESCRIPTION}</p>
      </div>
      <button type="button" onClick={reset}>{BASELINE_RETRY}</button>   // AR7 native reset
      {shouldShowErrorDetails(error) && <ErrorDetails error={error} />} // AR18 outside the alert
    </main>
  );
}
```

`role="alert"` wraps **only** the heading + message; the reset button and the dev-only diagnostics live
outside it (AR1, AR18). `shouldShowErrorDetails` is a type-guard mirroring `AuthErrorBoundary`'s, gated
to `NODE_ENV` development/test (never production); `ErrorDetails` renders a native
`<details>/<summary>/<pre>` of `error.message` only. No animation (AR16), no asset-dependent imagery
(AR15). If `error-fallback.tsx` nears the rca 10-function cap, `ErrorDetails`/`shouldShowErrorDetails`
move to a co-located file (NFR3). `ErrorFallbackProps { error?: Error; reset?: () => void }` lives in
`src/components/types/error-boundary/index.ts` (type-only, NFR7).

**Acceptance Criteria.**

- Given `ErrorFallback` rendered with **no** `ThemeProvider`/`I18nextProvider`, When it mounts, Then it
  shows the hardcoded baseline title/description and a focusable reset, with contrast-safe static styles
  (degraded path works) (FR9, AR11, AR13, AC9).
- Given the fallback, When the live region is inspected, Then `role="alert"` wraps only the heading +
  message; the reset button and dev diagnostics are outside it (AR1, AR18).
- Given the fallback mounts, When focus is checked, Then focus is on the `<h1>` (`tabIndex={-1}`, AR5).
- Given a `reset` prop, When the reset button is activated by keyboard (Enter/Space) or click, Then
  `reset()` is called (AR6, AR7).
- Given `NODE_ENV=production`, When rendered, Then no `<details>` diagnostics appear; Given
  development/test, Then `<details>` shows `error.message` only (AR18).
- Given the file, When measured by rca, Then it stays under all thresholds (helpers extracted if
  needed) (NFR3), and props live in a type-only file (NFR7).

**Files touched.** `src/components/error-boundary/error-fallback.tsx` (new),
`src/components/types/error-boundary/index.ts` (new, type-only; may be extended in Story 1.3).

**Tests to add/update.** Unit (new `tests/unit/components/error-boundary/error-fallback.test.tsx`):
no-provider (degraded) render shows baseline copy + focusable reset; `role="alert"` scope; focus on
mount; reset callback fires on keyboard + click; dev-only `<details>` gating (assert both
production-off and dev-on). Locate by role/heading/text (NFR5). Full coverage (NFR10).

**Dependencies.** None to render (presentational); consumed by Stories 1.3 (boundary) and 1.9
(`RouteError`).

**Definition of Done.** `ErrorFallback` + props added and 100% covered; degraded render + a11y
assertions green; `make lint-dup`/`make lint-metrics`/ESLint (no `data-testid`)/TS/dependency-cruiser
pass; no suppression, no inline comment.

---

### Story 1.3: Add the root `AppErrorBoundary` (feature-agnostic class) wired to the reporter

**User story.** As any user, I want a single root error boundary so a render error anywhere in the app
shows the recovery screen instead of whiting out the whole page, and as an operator I want every caught
error forwarded to the reporter.

**Description.** Add `src/components/error-boundary/app-error-boundary.tsx` — a feature-agnostic class
boundary mirroring `AuthErrorBoundary`'s shape but reporter-driven and rendering `ErrorFallback`
(FR8, FR9, FR10, FR13):

```text
class AppErrorBoundary extends React.Component<AppErrorBoundaryProps, AppErrorBoundaryState> {
  static getDerivedStateFromError(error: Error) { return { hasError: true, error }; }
  componentDidCatch(error: Error, info: React.ErrorInfo) {
    this.props.reporter.report(error, { componentStack: info.componentStack });   // FR10
    // dev/test-only console (mirror shouldShowErrorDetails gating); never in production
  }
  handleReset = () => this.setState({ hasError: false, error: undefined });        // FR9/AR6
  render() {
    return this.state.hasError
      ? <ErrorFallback error={this.state.error} reset={this.handleReset} />
      : this.props.children;
  }
}
```

`AppErrorBoundaryProps { children: ReactNode; reporter?: ErrorReporter }` with `reporter` defaulting to
the import-light `noopErrorReporter` singleton (Story 1.1); `AppErrorBoundaryState { hasError: boolean;
error?: Error }` — both in the type-only `src/components/types/error-boundary/index.ts` (NFR7). The
boundary imports **only** React, `ErrorFallback`, and the `ErrorReporter` type + default singleton —
**nothing** from `@auth/*`, `src/modules/**`, or `dependency-injection-config.ts` (FR8, NFR2; enforced
in Story 1.10). Add the `src/components/error-boundary/index.ts` barrel (`AppErrorBoundary`,
`ErrorFallback`).

**Acceptance Criteria.**

- Given a child that throws, When `AppErrorBoundary` renders, Then `ErrorFallback` is shown (the tree is
  not unmounted/blank) (FR8, FR9, AC5).
- Given the reset action, When activated, Then `hasError` clears and the children re-render (recovered),
  with deterministic focus (FR9, AR6, AC6).
- Given an injected **mock reporter**, When a child throws, Then `reporter.report` is called with the
  thrown error (and the component stack) (FR10, AC7).
- Given `NODE_ENV=production`, When a child throws, Then nothing is logged to `console`; Given
  development/test, Then the gated console fires (AR18).
- Given the boundary's imports, When inspected, Then there is no `@auth/*`, `src/modules/**`, or
  `dependency-injection-config` import (FR8, NFR2, AC8).
- Given the class, When measured by rca, Then it stays ≤8 public methods / ≤2 public attributes and
  under the size caps (NFR3); props/state live in a type-only file (NFR7).

**Files touched.** `src/components/error-boundary/app-error-boundary.tsx` (new),
`src/components/error-boundary/index.ts` (new), `src/components/types/error-boundary/index.ts` (extend
with `AppErrorBoundaryProps`/`AppErrorBoundaryState`).

**Tests to add/update.** Unit (new `tests/unit/components/error-boundary/app-error-boundary.test.tsx`):
throwing child → fallback; reset → recovered children; an injected mock reporter receives the error;
dev/production console gating (both branches). Exact-value assertions (NFR12). Full coverage (NFR10).

**Dependencies.** 1.1 (`ErrorReporter`/singleton), 1.2 (`ErrorFallback`).

**Definition of Done.** `AppErrorBoundary` added and 100% covered; catch/reset/reporter/gating
assertions green; feature-agnostic imports confirmed; `make lint`/`make lint-metrics`/dependency-cruiser
pass; no suppression, no `data-testid`, no inline comment.

---

### Story 1.4: Add the `AppProviders` composition root and slim `index.tsx`

**User story.** As a contributor, I want one ordered, documented place to compose global providers so
adding a provider is a single localized edit instead of everyone editing the `index.tsx` pyramid.

**Description.** Add `src/providers/app-providers.tsx` composing the providers in the exact current
order plus an explicit `I18nextProvider` (FR1, NFR1):

```text
function AppProviders({ children }: AppProvidersProps): JSX.Element {
  return (
    <StyledEngineProvider injectFirst>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <I18nextProvider i18n={i18n}>
          <React.Suspense fallback={null}>{children}</React.Suspense>
        </I18nextProvider>
      </ThemeProvider>
    </StyledEngineProvider>
  );
}
```

`i18n` is the existing singleton from `src/i18n` (eager init untouched); `<I18nextProvider>` is
behavior-equivalent to today's default-instance binding (NFR1). Add `src/providers/index.ts` (barrel)
and `src/providers/types/app-providers/index.ts` (`AppProvidersProps { children: ReactNode }`,
type-only, NFR7). `AppProviders` imports only MUI, `react-i18next`, the theme, and the i18n singleton —
**never** the DI container (NFR2). Then modify `src/index.tsx` (FR2) to mount:

```text
root.render(
  <React.StrictMode>
    <AppErrorBoundary>
      <AppProviders><App /></AppProviders>
    </AppErrorBoundary>
  </React.StrictMode>
);
```

Remove the inline pyramid (`index.tsx:23-31`) and the inner `Suspense`; keep `reflect-metadata` first
(`:1`) and the eager `import i18n` so `i18n.t('root_element_missing')` (`:17`) still works. `App` still
hosts the inline router until Story 1.9.

**Acceptance Criteria.**

- Given a child rendered through `AppProviders`, When mounted, Then the MUI theme, `CssBaseline`, and
  i18n are all in effect, in the required order (`injectFirst`, `CssBaseline` before children) (FR1,
  NFR1, AC1).
- Given `index.tsx`, When read, Then it contains no provider pyramid and mounts only
  `<StrictMode><AppErrorBoundary><AppProviders><App/></AppProviders></AppErrorBoundary></StrictMode>`
  (FR2, AC1).
- Given the entry path, When imports are inspected, Then neither `AppProviders` nor `index.tsx` imports
  `dependency-injection-config.ts` (NFR2, AC12).
- Given the existing routes, When `/`, `/sign-up`, `/sign-in` render, Then output is unchanged (NFR1,
  AC10).
- Given the props, When inspected, Then `AppProvidersProps` lives in a type-only file (NFR7).

**Files touched.** `src/providers/app-providers.tsx` (new), `src/providers/index.ts` (new),
`src/providers/types/app-providers/index.ts` (new, type-only), `src/index.tsx` (modify).

**Tests to add/update.** Unit (new `tests/unit/providers/app-providers.test.tsx`): a child renders with
theme + i18n + `CssBaseline` in effect; assert provider order/composition. (`src/index.tsx` stays
coverage-excluded, so its thin mount is verified by review + the existing app render, not a coverage
test.) Full coverage of `AppProviders` (NFR10).

**Dependencies.** 1.3 (`AppErrorBoundary` is mounted around `AppProviders`).

**Definition of Done.** `AppProviders` added and 100% covered; `index.tsx` slimmed; provider-order +
no-DI-import assertions green; existing routes render unchanged; `make lint`/`make lint-metrics`/
dependency-cruiser pass; no suppression, no inline comment.

---

### Story 1.5: Add the typed route-path constants (`route-paths.ts`)

**User story.** As a developer, I want a single typed source of truth for route paths so route strings
are not scattered and a mistyped path fails the type-checker.

**Description.** Add `src/routes/route-paths.ts` (FR4):

```text
export const ROUTE_PATHS = {
  home: '/', signUp: '/sign-up', signIn: '/sign-in', notFound: '*',
} as const;
```

An `as const` object literal (not a function — compliant with the #100 no-free-function gate, like
`tokens.ts`). Consumed by `routes.tsx` (Story 1.9). Whether `ProtectedRoute` adopts `ROUTE_PATHS.signIn`
is D6 (depends on the new dependency-cruiser rules; if a feature may not import `src/routes`, keep the
literal + a consistency test).

**Acceptance Criteria.**

- Given `ROUTE_PATHS`, When inspected, Then `home==='/'`, `signUp==='/sign-up'`, `signIn==='/sign-in'`,
  `notFound==='*'` (exact values, mutation-hardened) (FR4, NFR12, AC2).
- Given the file, When linted, Then it declares no function and no `interface`/`type` (object literal
  only) (NFR6, NFR7).

**Files touched.** `src/routes/route-paths.ts` (new).

**Tests to add/update.** Unit (new `tests/unit/routes/route-paths.test.ts`): assert each exact constant
value. Full coverage (NFR10).

**Dependencies.** None (foundation for Story 1.9).

**Definition of Done.** `route-paths.ts` added and 100% covered; exact-value assertions green;
ESLint/TS/`make lint-metrics` pass; no suppression, no inline comment.

---

### Story 1.6: Add `RootLayout` and consolidate the `dir` side effect (remove the `button-example` duplicate)

**User story.** As a maintainer, I want one root layout route that owns the document-direction side
effect and an `<Outlet/>`, so the side effect is defined once and every route renders through a single
layout.

**Description.** Add `src/components/layouts/root-layout.tsx` — the outermost layout route element. It
relocates the `dir` side effect **verbatim** from `app.tsx:36-44` (sync
`document.documentElement.dir` from `i18n.dir(i18n.language)` on mount + `languageChanged`, cleanup via
`i18n.off`), keeps the `lang` line **commented** (D3 — no Firefox baseline regen, FR14), and renders
`<Suspense fallback={null}><Outlet/></Suspense>` so chrome stays mounted while a lazy child loads
(FR7):

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

Then remove the duplicate `document.documentElement.dir` `useEffect` from `src/button-example.tsx:11-13`
(and its now-unused `i18n` import). The live app still uses `app.tsx`'s `dir` effect until Story 1.9
wires `RootLayout`, so `dir` is never dropped or doubled.

**Acceptance Criteria.**

- Given `RootLayout` mounts, When the effect runs, Then `document.documentElement.dir` is set from
  `i18n.dir(i18n.language)`; Given a `languageChanged` event, Then `dir` is re-applied; Given unmount,
  Then the listener is removed (FR14, AC11).
- Given `RootLayout`, When inspected, Then `document.documentElement.lang` is NOT set (the line stays
  commented) (D3, AC11).
- Given `RootLayout` with a routed child, When rendered, Then the child renders inside the
  `<Suspense><Outlet/></Suspense>` (FR7).
- Given `button-example.tsx`, When read, Then it no longer sets `document.documentElement.dir` and has
  no unused `i18n` import (FR14, AC11).
- Given the effect, When measured by rca, Then it stays ≤3 exit points / Cognitive ≤15 (NFR3).

**Files touched.** `src/components/layouts/root-layout.tsx` (new), `src/button-example.tsx` (modify).

**Tests to add/update.** Unit (new `tests/unit/components/layouts/root-layout.test.tsx`): `dir` on
mount + `languageChanged`, cleanup, `lang` unset, `<Outlet/>` child renders (use a `MemoryRouter` with
a child route or the repo's router-test idiom). Update `tests/unit/button-example.test.tsx` (if present):
assert no `dir` effect. Full coverage (NFR10).

**Dependencies.** None to author (1.5 is paired but not required); wired by Story 1.9.

**Definition of Done.** `RootLayout` added and 100% covered; `dir`/`lang`/outlet assertions green;
`button-example` duplicate removed; `make lint`/`make lint-metrics` pass; no suppression, no inline
comment.

---

### Story 1.7: Add `AppLayout` — the authenticated app-chrome layout

**User story.** As a developer, I want a representative app-chrome layout for the authenticated area so
future protected pages render through it via `<Outlet/>` instead of re-implementing chrome.

**Description.** Add `src/components/layouts/app-layout.tsx` — a minimal authenticated-area layout that
wraps the protected `/` area (rendered under `ProtectedRoute`) and renders an `<Outlet/>`-based chrome
(a `<main>` landmark placeholder; no nav menu — future work) (FR7). It takes no props.
`ButtonExample` remains the representative home child (rendered through this layout once wired in Story
1.9).

**Acceptance Criteria.**

- Given `AppLayout` with a routed child, When rendered, Then the child renders inside the app chrome
  (`<main>` landmark) via `<Outlet/>` (FR7, AC4).
- Given the file, When measured by rca, Then it defines a single component under all thresholds (NFR3).

**Files touched.** `src/components/layouts/app-layout.tsx` (new).

**Tests to add/update.** Unit (new `tests/unit/components/layouts/app-layout.test.tsx`): renders the
`<Outlet/>` child inside the `<main>` chrome (router-test idiom). Locate by role/text (NFR5). Full
coverage (NFR10).

**Dependencies.** None to author; wired by Story 1.9.

**Definition of Done.** `AppLayout` added and 100% covered; outlet/landmark assertions green;
`make lint`/`make lint-metrics` pass; no suppression, no `data-testid`, no inline comment.

---

### Story 1.8: Add the accessible 404 Not-Found page (+ i18n en/uk)

**User story.** As a visitor who hits an unknown URL, I want a clear, accessible "page not found" screen
with a way back, so I am not stuck on a blank or broken page.

**Description.** Add `src/components/not-found/not-found.tsx` — a normal routed page in the **healthy**
tree (so it may use i18n/theme) (FR6; AR2, AR3, AR4, AR9, AR10, AR15, AR17):

```text
function NotFound(): JSX.Element {
  usePageTitleLike('not_found.title');                 // AR4 descriptive document.title
  const { t } = useTranslation();
  return (
    <>
      <UIBackToMain />                                  // reused chrome (AR10 fix applied)
      <Box component="main">                            // AR17 landmark
        <UITypography component="h1" variant="h4">{t('not_found.title')}</UITypography>  // AR3 one h1
        <UITypography>{t('not_found.description')}</UITypography>
        <UIButton to={ROUTE_PATHS.home}>{t('not_found.cta')}</UIButton>   // AR9 descriptive CTA
      </Box>
      <UIFooter />
    </>
  );
}
```

It MUST NOT use `role="alert"`/assertive (AR2) — a 404 is not an error event. Add
`src/components/not-found/i18n/{en,uk}.json` with a unique top-level `not_found` namespace
(`title`, `description`, `cta` = "Go to homepage" / localized), both locales present (auto-merged by
`scripts/localization-generator.js`; no collision with existing keys; NFR9). It reuses the shared
`UIBackToMain` + `UIFooter` chrome (D4-A); because `UIBackToMain`'s hardcoded `aria-label="Back"`
overrides its visible localized label (a pre-existing WCAG 2.5.3 + i18n defect), **fix it deliberately**
here (drop/localize the redundant `aria-label`) rather than inherit it (AR10, D-F, Risk R9). Set
`document.title` via the auth `usePageTitle` pattern (reused or a small shell-local equivalent).

**Acceptance Criteria.**

- Given a render of `NotFound`, When queried, Then there is exactly one
  `getByRole('heading', { level: 1 })` with descriptive text, inside a `<main>` landmark, and **no**
  element with `role="alert"` (FR6, AR2, AR3, AR17, AC3).
- Given `NotFound` mounts, When the title is checked, Then `document.title` is the descriptive localized
  not-found title (AR4, AC3).
- Given the CTA, When queried, Then it is a descriptive `getByRole('link', { name })` to the home path
  (AR9, AC3).
- Given the reused `UIBackToMain`, When its accessible name is checked, Then it matches its visible
  localized label (the `aria-label="Back"` defect is fixed, not inherited) (AR10).
- Given the i18n, When checked, Then `not_found.*` exists in both `en.json` and `uk.json` and merges
  into `localization.json` (NFR9, AC13).

**Files touched.** `src/components/not-found/not-found.tsx` (new),
`src/components/not-found/i18n/en.json` (new), `src/components/not-found/i18n/uk.json` (new),
`src/components/ui-back-to-main/index.tsx` (+ its types if needed — modify, AR10 accessible-name fix).

**Tests to add/update.** Unit (new `tests/unit/components/not-found/not-found.test.tsx`): one `<h1>`,
`<main>`, descriptive `document.title`, descriptive CTA link, no `role="alert"`; corrected
`UIBackToMain` accessible name. Update/extend the `ui-back-to-main` test for the accessible-name fix.
Semantic selectors only (NFR5). Full coverage (NFR10).

**Dependencies.** 1.5 (`ROUTE_PATHS` for the CTA). Wired into the router by Story 1.9.

**Definition of Done.** `NotFound` + i18n added and 100% covered; a11y assertions green; `UIBackToMain`
defect fixed; i18n en/uk parity; `make lint`/`make lint-dup`/`make lint-metrics` pass; no suppression,
no `data-testid`, no inline comment.

---

### Story 1.9: Extract the route layer (`errorElement` + layout route + 404) and slim `app.tsx`

**User story.** As a contributor, I want routes defined in one dedicated layer with a layout route, a
root error element, and a 404 catch-all, so adding a page is a localized edit and broken pages/unknown
URLs degrade gracefully instead of whiting out the app.

**Description.** Add `src/components/error-boundary/route-error.tsx` — a thin bridge that calls
`useRouteError()` and renders `<ErrorFallback error={normalize(routeError)} />` (FR5; the route-level
error surface, complementing the app-level `AppErrorBoundary`). Add `src/routes/routes.tsx` (FR3, FR5,
FR6, FR7):

```text
export const router = createBrowserRouter([
  {
    element: <RootLayout />,
    errorElement: <RouteError />,                                          // FR5
    children: [
      { element: <ProtectedRoute />, children: [
          { element: <AppLayout />, children: [
              { path: ROUTE_PATHS.home, element: <ButtonExample /> } ] } ] },   // FR7
      { path: ROUTE_PATHS.signUp, element: <SignUp /> },
      { path: ROUTE_PATHS.signIn, element: <SignIn /> },
      { path: ROUTE_PATHS.notFound, element: <NotFound /> },              // FR6 catch-all
    ],
  },
], { future: { v7_startTransition: true } });
```

`SignUp`/`SignIn`/`ButtonExample` stay `React.lazy` route-level chunks (preserving splitting + the auth
budget, NFR2); `RootLayout`/`AppLayout`/`NotFound`/`RouteError` are eager. Add `src/routes/index.ts`
(barrel: `router`, `ROUTE_PATHS`). Reduce `src/app.tsx` (FR3, FR14) to the thin host and **remove** its
`dir` effect (now in `RootLayout`), the inline route array, the lazy imports, and the second
`Suspense`:

```text
import { router } from '@/routes';
function App(): React.ReactElement { return <RouterProvider router={router} />; }
export default App;
```

Note: `routes.tsx` imports the auth **public** route entries (`@auth/.../routes/sign-up|sign-in`,
`@auth/components/protected-route`) — the same imports today's `app.tsx` makes; the new
dependency-cruiser rule (Story 1.10) targets feature **internals**, not these public entries.

**Acceptance Criteria.**

- Given the router, When `/`, `/sign-up`, `/sign-in` resolve, Then their elements render through the
  `RootLayout` outlet (and `/` through `AppLayout` under `ProtectedRoute`) (FR3, FR7, AC2, AC4).
- Given an unknown path, When it resolves, Then `NotFound` renders (catch-all, no redirect) (FR6, AC3).
- Given the root route, When inspected, Then it has an `errorElement`; given a thrown route error, Then
  `RouteError` renders `ErrorFallback` (FR5, AC4).
- Given `app.tsx`, When read, Then it only hosts `<RouterProvider router={router}/>` (no inline route
  array, no `dir` effect, no second `Suspense`) (FR3, FR14, AC2).
- Given the route layer, When imports are inspected, Then it imports only auth **public** route entries
  (not feature internals) and not `dependency-injection-config` (NFR2, AC8).

**Files touched.** `src/routes/routes.tsx` (new), `src/routes/index.ts` (new),
`src/components/error-boundary/route-error.tsx` (new), `src/app.tsx` (modify).

**Tests to add/update.** Unit (new `tests/unit/routes/routes.test.tsx`): `createMemoryRouter` resolves
`/`, `/sign-up`, `/sign-in`; unknown path → `NotFound`; root route exposes an `errorElement`; pages
render through the outlets (follow `tests/unit/app.test.tsx` mocking idiom). New
`tests/unit/components/error-boundary/route-error.test.tsx`: renders `ErrorFallback` from a simulated
`useRouteError`. Update `tests/unit/app.test.tsx`: thin host — mock `@/routes` `router`, assert
`RouterProvider` renders it; drop the inline-route/`dir` assertions (now in `routes`/`root-layout`
tests). Full coverage (NFR10).

**Dependencies.** 1.5 (`ROUTE_PATHS`), 1.6 (`RootLayout`), 1.7 (`AppLayout`), 1.8 (`NotFound`), 1.2
(`ErrorFallback` for `RouteError`).

**Definition of Done.** Route layer + `RouteError` added; `app.tsx` slimmed; route-resolution/404/
error-element assertions green; `app.test.tsx` updated; `make lint`/`make lint-metrics`/
dependency-cruiser pass; no suppression, no `data-testid`, no inline comment.

---

### Story 1.10: Add dependency-cruiser layer rules enforcing shell decoupling

**User story.** As a maintainer, I want the new shell layers machine-prevented from importing feature
internals or the heavy DI graph, so the decoupling and the auth Lighthouse budget cannot silently
erode.

**Description.** Add three rules to `.dependency-cruiser.js` (severity `error`, house `{ name, comment,
severity, from, to }` shape, mirroring `no-cross-feature-imports`) (FR12, NFR2):

- `no-providers-import-feature-internals`: `from: { path: '^src/providers/' }` →
  `to: { path: '^src/modules/[^/]+/features/' }`.
- `no-routes-import-feature-internals`: `from: { path: '^src/routes/' }` →
  `to: { path: '^src/modules/[^/]+/features/' }`, permitting the established auth **public** route/
  component entries via a negative-lookahead `pathNot` (mirror `no-repository-internal-imports`) so
  `routes.tsx` can import `@auth/.../routes/sign-up|sign-in` and `protected-route` as it does today.
- `no-shell-to-di-config`:
  `from: { path: ['^src/components/', '^src/providers/', '^src/routes/'] }` →
  `to: { path: '^src/config/dependency-injection-config' }`.

Keep `no-components-import-modules` (`.dependency-cruiser.js:230-239`) and the composition-root DI-config
rule (`:326-344`) **intact** (no loosening). Verify `make lint-deps` reports zero violations against
the new shell files.

**Acceptance Criteria.**

- Given the new rules, When `make lint-deps` runs, Then it passes with zero violations and the existing
  rules are unchanged (FR12, AC8).
- Given a probe import (review-only, not committed) from `src/components`/`src/providers`/`src/routes`
  into a feature internal, When linted, Then it is flagged `error` (FR12, AC8).
- Given a probe import from a shell layer into `dependency-injection-config`, When linted, Then it is
  flagged `error` (NFR2, AC8, AC12).
- Given `routes.tsx`'s import of the auth public route entries, When linted, Then it is allowed (not a
  feature-internal violation) (FR12).

**Files touched.** `.dependency-cruiser.js` (modify).

**Tests to add/update.** Verified via `make lint-deps` in CI (dependency-cruiser is not unit-tested);
the probe checks are a review step (no committed probe). The rule names are asserted indirectly by the
green `make lint` gate.

**Dependencies.** Stories 1.1-1.9 (the shell files must exist so the rules guard real edges and the
no-violation check is meaningful).

**Definition of Done.** Three rules added (error severity, house shape); existing rules intact;
`make lint-deps` green with zero violations; no suppression.

---

### Story 1.11: Gate sweep, full coverage, mutation, and housekeeping

**User story.** As a maintainer, I want every gate green and the spec wired into the loop, so the shell
refactor ships clean and the next spec can run.

**Description.** Final integration pass (FR1-FR14, NFR1-NFR14, AC1-AC16). Run `make format` then
`make lint` (ESLint, tsc, `make lint-md`, `make lint-dup`, `make lint-metrics`), dependency-cruiser,
unit + integration (100% over `src/**`), and Stryker mutation; confirm the mobile Lighthouse CI gate
stays ≥0.85 on `/sign-up`/`/sign-in` (the shell additions add no paint-path JS to those pages, NFR2)
and that the shell entry path does not statically import `dependency-injection-config` (AC12). Fix any
gate failure at the root (no suppressions, NFR11). Confirm i18n en/uk parity and regenerate
`localization.json` (NFR9). Housekeeping (applied by the loop): point `_bmad/config.yaml`
`planning_artifacts`/`implementation_artifacts` at `specs/enterprise-app-shell/...`, and add an
`enterprise-app-shell` row to `specs/README.md`.

**Acceptance Criteria.**

- Given the full suite, When CI runs, Then ESLint/tsc/`make lint-md`/`make lint-dup`/`make lint-metrics`/
  dependency-cruiser/unit/integration all pass with no new suppressions, no `data-testid` in `src/**`,
  and no new inline comments (NFR3-NFR11, AC15).
- Given coverage, When measured, Then `src/**` stays at 100% (branches/functions/lines/statements) with
  every new file covered by positive/negative/edge tests (NFR10, AC14).
- Given Stryker, When run, Then no surviving mutant on the new branches (the `*` wildcard, the fallback
  `role="alert"`, the 404 heading/title, the reporter call) (NFR12, AC16).
- Given the mobile Lighthouse CI run, When measured, Then `/sign-up`/`/sign-in` stay ≥0.85 and the shell
  entry path does not statically import the DI container (NFR2, AC12).
- Given i18n, When generated, Then `not_found.*` is present in both locales and merged (NFR9, AC13).
- Given housekeeping, When applied, Then `_bmad/config.yaml` and `specs/README.md` point at/list the new
  spec.

**Files touched.** `_bmad/config.yaml` (modify), `specs/README.md` (modify); any small fixes surfaced
by the gate sweep.

**Tests to add/update.** The aggregate suites above; no new product tests beyond those added in Stories
1.1-1.9. Add any missing coverage/mutation assertions surfaced by the sweep.

**Dependencies.** Stories 1.1-1.10.

**Definition of Done.** `make format` then `make lint` green; unit + integration 100% over `src/**`;
Stryker clean on new branches; Lighthouse CI ≥0.85; i18n parity; housekeeping applied; commit header
≤100 chars with `(#104)` scope and `Closes #104` in the squash message; no suppression, no
`data-testid`, no inline comment.
