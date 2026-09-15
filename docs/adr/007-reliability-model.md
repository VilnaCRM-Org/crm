# ADR-007: Reliability model: recoverable errors, route boundaries, and visible fallbacks

- Status: Approved
- Deciders: [@RudoiDmytro](https://github.com/RudoiDmytro)
- Date: 2026-09-15

**Technical Story**: The application had one reliability story, and it belonged to the auth
feature. Issue [#116](https://github.com/VilnaCRM-Org/crm/issues/116) asked for a system-wide
model — a typed recoverable-error contract, a reusable boundary, a route-scoped `errorElement`
on every route, a real Suspense fallback everywhere, and a machine gate — and supersedes issue
[#24](https://github.com/VilnaCRM-Org/crm/issues/24), which asked for the reusable boundary alone.

## Context and Problem Statement

Before this change the shell mounted exactly one boundary, `AppErrorBoundary`, around the whole
tree, and the router attached exactly one `errorElement` — on the root route in
`src/routes/route-composer.tsx`. A render error on any page therefore either unmounted the entire
application into the root fallback or, when react-router caught it first, replaced the whole
routed tree with the same generic screen. The fallback offered one unconditional **Try again**
button that re-rendered the same failing subtree regardless of what had thrown, and navigated home
on the route path without saying so.

The concept of a recoverable error already existed twice. `UiError` (`src/services/error/`)
carries `retryable`, driven by a per-code map that marks network, timeout, rate-limit and 5xx
failures retryable; `AuthError` (`@auth/types/auth-error`) carries its own `retryable`. No
boundary read either flag: `AuthErrorBoundary` caught raw `Error`s, rendered an always-on retry
button, and wrote to `console.error` from `componentDidCatch`. Two `<Suspense fallback={null}>`
sites (`src/providers/app-providers.tsx` and the registration form) painted nothing while a
chunk loaded and announced nothing to assistive technology. Nothing in CI could see any of this:
the only fallback check was a golden-text pin on `root-layout.tsx`, and the 49 dependency-cruiser
rules say nothing about `errorElement` or `fallback`.

The constraint that shapes every option is the paint path. The mobile Lighthouse floor on
`/sign-in` holds only because nothing on the static import graph from `src/index.tsx` reaches
tsyringe, zod, Apollo or the Sentry SDK (`tests/unit/tooling/paint-path-graph.test.ts`), and two
dependency-cruiser rules keep the DI bridge out of the shell (`no-eager-shell-import-di-bridge`
for `src/index.tsx`, `src/app.tsx` and `src/routes/**`; `no-paint-path-import-di-bridge` for the
auth feature). The root boundary and the route shell therefore cannot resolve a reporter from the
container — whatever reports for them has to be container-free and arrive some other way.

## Decision Drivers

- One retry semantics: a boundary must decide whether to offer retry from the error it caught,
  and both existing `retryable` flags must map onto that decision — no third flag.
- Fault isolation per route: a page that throws must take down only itself, so fifty parallel
  page authors inherit one boring pattern instead of inventing their own.
- The paint path stays container-free (`no-eager-shell-import-di-bridge`, the paint-path graph
  test, the mobile Lighthouse budget), so the root boundary cannot call `useService` and cannot
  import the composition root.
- Every failure state is reachable and announced: no dead end, no blank screen, no second
  `<main>` landmark, focus that lands on the recovered content.
- Boundaries never write to the console; React 19 already logs every caught error through
  `onCaughtError`, and the console gate (issue #192) fails a test on any extra line.
- The standard has to be enforced by a gate that fails a pull request, not by review.
- Repository conventions: class-only non-React `.ts` with approved suffixes (issue #129), the
  #128/#130 DI gates and their carve-out lists, `src/lib/**` as the home for framework-free
  logic.

## Considered Options

1. **Keep per-feature boundaries** — leave `AuthErrorBoundary` as the pattern and let each
   feature copy it.
2. **A shared boundary that resolves its reporter through `useService`** — the #128 bridge,
   extended to the root.
3. **A shared boundary that receives a container-free reporter by prop** — `UIErrorBoundary`
   composed by the shell and by `AuthErrorBoundary`, with `boundaryErrorReporter` passed in.
4. **Root-only `errorElement`** versus **an `errorElement` on every route** the composer emits.
5. **A dependency-cruiser rule** versus **ESLint `no-restricted-syntax` selectors** as the gate.

## Decision Outcome

Chosen: **option 3 for the boundary, an `errorElement` on every route, and ESLint as the gate.**

**The contract.** `src/lib/reliability/types/recoverable-error.ts` declares `RecoverableError`
(`recoverable`, `strategy: 'retry' | 'reset' | 'reload' | 'navigate-home' | 'none'`, an i18n
`messageKey` — never a raw `error.message` — a `severity`, and an optional `cause` kept for
logging only). `RecoveryStrategyDetector.classify(error)` maps any thrown value onto it by trying
five rules in order: a value that already satisfies `RecoverableErrorGuard` is returned as is; a
`{ retryable: boolean }` duck type — the shape of both `UiError` and `AuthError` — becomes
`retry` or `none`, which is the whole mapping of the two existing flags; a chunk-load failure
(`ChunkLoadErrorDetector`: `name === 'ChunkLoadError'` or a message mentioning a chunk) becomes
`reload`; a react-router error response (recognised with the router's own `isRouteErrorResponse`)
becomes `retry` when its status is 5xx — a loader or action that failed transiently — and
`navigate-home` for 4xx; everything else becomes `reset`.
The literal results live in one `RECOVERIES` table, and a unit test asserts that every
`messageKey` it can emit resolves in both locales.

**The boundaries.** `UIErrorBoundary` (`src/components/error-boundary/ui-error-boundary.tsx`)
is the one class boundary. It classifies in `getDerivedStateFromError`, reports in
`componentDidCatch` through the `reporter` prop inside a `try` that never masks the error,
forwards `onError`, and renders `ErrorFallback` (or a caller-supplied renderer) under
`key={attempt}` so a retry that fails again remounts the fallback and repeats its focus and its
announcement. When the error clears it moves focus to `main[tabindex="-1"]` or
`h1[tabindex="-1"]` on the next animation frame. The shell mounts it once with `surface="app"`;
`AuthErrorBoundary` composes it with `surface="auth"` and the auth reporter. `ErrorFallback`
renders a focused `<h1>`, a `role="alert"` message keyed by `recovery.messageKey`, a strategy-gated
action button (**Try again** for `retry` / `reset`, **Reload the page** for `reload`, nothing for
`navigate-home` / `none`) and an unconditional **Go to homepage** anchor — a real `href`, so no
state is ever a dead end and a stale-deploy chunk failure is cured by the full navigation. Its
`landmark` prop renders `<main>` for open routes and an `aria-labelledby` `<section>` under
`AppLayout`, whose own `<main>` would otherwise be nested. Diagnostics stay out of production.

**Every route carries an `errorElement`.** `routeMapper.map(route, landmark)` attaches
`<RouteError landmark=… />` to every mapped route, and the composer attaches one to the root
route and to both layout routes of the protected branch, passing `'region'` under `AppLayout`
and `'main'` elsewhere. `RouteError` is presentational: it classifies `useRouteError()`, and its
reset re-navigates to the current location (`navigate('.', { replace: true })`) so **Try again**
really re-renders the route; a cached `React.lazy` rejection re-throws, which is the bounded
outcome. Reporting moved to the router seam: `routeComposer.routeErrorHandler()` builds the
`onError` callback that `src/routes/routes.tsx` exports as `onRouteError` and `src/app.tsx` hands
to `<RouterProvider onError>`, reporting with `surface: 'route'`.

**The reporter arrives by prop.** `boundaryErrorReporter`
(`src/services/error-reporting/boundary-error-reporter.ts`) is a container-free module singleton
that calls `securityEventCore.boundaryCatch(surface)` and then `observabilityCore.captureError`,
so every boundary catch leaves through the observability boundary (ADR-005) with the surface in
the security event. `src/index.tsx` and the route composer — both already carve-outs of
the #128 gate — import it and pass it down; `AuthErrorReporter` delegates to it with
`surface: 'auth'`. It is also registered by value under
`ERROR_REPORTING_TOKENS.BoundaryErrorReporter`, so a container-resolved class injects the very
instance the shell holds instead of value-importing it (issue #130), and it is listed in
`EXEMPT_RENDER_PATH_FILES` in `config/di-collaborator-policy.js`, the carve-out that policy
provides for a render-path leaf. The container-resolved `ErrorReporter`
(`ObservabilityErrorReporter`) stays for lazily routed pages, which may call `useService`. The
old `NoopErrorReporter` had no remaining caller and was deleted rather than kept as dead code.
`UIErrorBoundary` needs no carve-out of its own: it value-imports only `src/lib/**`, so the
"a class component cannot call a hook" exemption the old root boundary needed is gone with it.

**The gate.** Five `no-restricted-syntax` selectors (four families) in `eslint.config.mjs`, all at
`error`: `fallback={null | undefined | false | true | ""}` on any element; `<Suspense>` /
`<React.Suspense>` with no `fallback` attribute; a named import of `createBrowserRouter` /
`createHashRouter` / `createMemoryRouter` from `react-router`, and a namespace import of
`react-router` (which reaches the same factories) — both spread into every `src/`-scoped block,
the `.ts` blocks included, because flat config replaces rather than merges `no-restricted-syntax`
per file; and, inside
`src/routes/**/*.tsx` only, an object literal with an `element` property and no sibling
`errorElement` (`:has(> …)`, so a child's `errorElement` never satisfies its parent).
`src/routes/routes.tsx`, the single sanctioned construction site, gets a block that omits exactly
the two router selectors. Every selector has a must-fail fixture per `:matches` branch in
`scripts/ci/eslint-gate-fixtures.mjs`, tagged `issue #116`, plus must-pass fixtures for the
`routes.tsx` carve-out and a fully decorated route object; the #189 rot guard refuses a selector
without one. The gate runs under `make lint-eslint` and the `static testing` workflow.

**Tests and the console.** React 19 logs every boundary-caught error itself, so every test that
renders a throwing child passes `onCaughtError` to `render` (`renderWithProviders` forwards it)
and asserts it was called once with the thrown error — never a file-wide spy, and never an
assertion that `console.error` was not called on a throwing render. The boundaries themselves
contain no `console.*` call.

## Positive Consequences

- One retry semantics. The button a user sees is derived from the error, and `UiError.retryable`
  and `AuthError.retryable` feed it through one mapping instead of two boundary-blind flags.
- A page that throws takes down only itself: the nearest `RouteError` renders inside the surviving
  layout, and the root boundary is reached only by an error the router did not catch.
- No blank loading state anywhere in `src/`: `grep -rn "fallback={null}" src/` is empty, and the
  ESLint gate keeps it empty.
- Every failure state has a way out (the unconditional homepage link), a landmark that does not
  nest, a heading that receives focus, and an alert that is announced — and a retry that fails
  again announces again, because the fallback remounts.
- Every catch reaches observability and the security-event channel with its surface (`app`,
  `auth`, `route`), and the paint path still never touches tsyringe — proven by the paint-path
  graph test, which now walks through `ui-error-boundary.tsx` and `boundary-error-reporter.ts`.
- The standard is a pull-request gate with must-fail fixtures, not a review checklist.

## Negative Consequences

- The reporter is wired by prop, so a component that mounts `UIErrorBoundary` must supply one;
  there is no default. That is deliberate — a silent default was exactly what `NoopErrorReporter`
  used to be — but it is one more required prop.
- The Suspense gate is syntactic. `fallback={<span />}` or `fallback={<></>}` passes it; the gate
  closes the null/undefined/false/empty-string hole, not the "visually empty element" one, which
  stays a review concern.
- The route-object selector sees only object literals in `src/routes/**`. A route built
  elsewhere reaches the tree only through the composer, and the router-construction ban keeps it
  that way, but a route object assembled from spread variables inside the shell is not inspected.
- `:has(> …)` relies on esquery's relative-selector support in the pinned 1.7; a downgrade would
  silently weaken the selector to the descendant form.
- `RouteError`'s **Try again** re-navigates to the same location. For a cached `React.lazy`
  rejection the retry re-throws; the fallback remounts and the homepage link remains, so it is
  bounded rather than fixed. Chunk-load recovery with a reload policy is deferred to
  [#147](https://github.com/VilnaCRM-Org/crm/issues/147), with one rule fixed now: never reload
  automatically on a protected route, because the auth token is memory-only and a reload signs
  the user out.
- The `role="alert"` message and the focused heading can both be announced on mount. That double
  announcement was reviewed and accepted; do not add `aria-live` on top.

## Pros and Cons of the Options

### Option 1 — keep per-feature boundaries

`AuthErrorBoundary` stays the pattern and each feature ships its own copy.

#### Good (Option 1)

- No shell change; the auth feature keeps full control of its fallback.

#### Bad (Option 1)

- Fifty pages means fifty copies of the retry policy, the i18n keys and the reporting call, and
  the jscpd gate would reject the copies before review could.
- Nothing forces a page author to add a boundary at all, which is how the router had none.

### Option 2 — a shared boundary that resolves its reporter through `useService`

The root boundary calls the #128 DI bridge for its reporter.

#### Good (Option 2)

- One wiring story for every component, with the reporter swappable through the container.

#### Bad (Option 2)

- A class component cannot call a hook, and the root boundary must be a class
  (`getDerivedStateFromError` has no hook equivalent).
- `useService` imports the composition root, so the boundary would drag tsyringe into the
  eager chunk: `no-eager-shell-import-di-bridge` fails, the paint-path graph test fails, and the
  mobile Lighthouse floor on `/sign-in` is lost.
- Error reporting would depend on the container resolving — the failure it exists to survive.

### Option 3 — a shared boundary that receives a container-free reporter by prop

`UIErrorBoundary` takes `reporter` from its mount site; the shell and the auth feature pass a
module singleton that composes the observability and security-event cores off the container.

#### Good (Option 3)

- Keeps the paint path container-free and the reporter swappable in tests through the prop.
- The same instance is registered by value for container-resolved code, so there is one
  reporter, not a paint-path copy and a container copy.
- The boundary imports nothing from `src/services/**`, so it needs no gate carve-out.

#### Bad (Option 3)

- One required prop, and a reporter path that exists beside the container-resolved
  `ErrorReporter` — two entry points to the same observability boundary.

### Option 4 — root-only `errorElement` versus one per route

#### Good (root only)

- One line in the composer; nothing for the mapper to attach.

#### Bad (root only)

- Any page error unmounts every layout and the navigation with it; the user lands on a generic
  screen with no context, which is the blast radius #116 documents.

#### Good (per route)

- The nearest boundary catches, the surrounding chrome survives, and **Try again** can re-render
  just the route.
- The shape is mechanical, so the route-object selector can enforce it.

#### Bad (per route)

- Two landmarks would nest under `AppLayout`; the `landmark` prop exists only to avoid that.
- Reporting cannot live in the element, because a route error element is not a class boundary —
  hence the `RouterProvider onError` seam.

### Option 5 — dependency-cruiser rule versus ESLint selectors

#### Good (dependency-cruiser)

- Already the home of the architecture rules, with its own rot guard.

#### Bad (dependency-cruiser)

- It sees import edges, not JSX attributes or object-literal shapes; it cannot tell
  `fallback={null}` from `fallback={<RouteFallback />}` or see a missing `errorElement`.

#### Good (ESLint)

- `no-restricted-syntax` matches the exact AST shape, runs in seconds under `make lint-eslint`,
  and the #189 fixture rot guard demands a must-fail fixture per selector.

#### Bad (ESLint)

- Flat config replaces `no-restricted-syntax` per file, so a selector must be re-listed in every
  block that can match a file — a block that forgets it silently un-gates its files. The
  `routeShellSelectors` family and the per-file route blocks exist to make that explicit.

## Links

- [Issue #116: standardize the reliability model](https://github.com/VilnaCRM-Org/crm/issues/116)
- [Issue #24: Error Boundary](https://github.com/VilnaCRM-Org/crm/issues/24) — superseded by #116
- [Issue #147: runtime resilience](https://github.com/VilnaCRM-Org/crm/issues/147) — retry with
  backoff, timeouts, offline detection and chunk-load recovery, deferred from this decision
- [ADR-005: Client security events leave through the observability boundary](./005-client-security-event-boundary.md)
  — the `error_boundary_catch` event every boundary surface now emits
- [`src/routes/README.md`](../../src/routes/README.md) — the route registry, the per-route
  `errorElement`, and the `onRouteError` seam
- [`config/di-collaborator-policy.js`](../../config/di-collaborator-policy.js) — the render-path
  carve-out that lists `boundary-error-reporter`
- [`scripts/ci/eslint-gate-fixtures.mjs`](../../scripts/ci/eslint-gate-fixtures.mjs) — the
  must-fail fixtures for the five selectors
