# ADR-018: Route error responses with a known status render the designed error pages

- Status: Approved
- Deciders: [@kravalg](https://github.com/kravalg)
- Date: 2026-10-01

**Technical Story**: [#309](https://github.com/VilnaCRM-Org/crm/issues/309) implements the
Figma 404, 403 and 5xx pages and asks `RouteError` to render them for route errors that carry
one of those statuses.

## Context and Problem Statement

[ADR-007](./007-reliability-model.md) routes every route error through
`recoveryStrategyDetector` and `ErrorFallback`: a 4xx router response shows "This page is not
available" with a homepage link, and a 5xx response shows **Try again**. The design now has
dedicated 404, 403 and 5xx pages, and the access layer planned in
[#114](https://github.com/VilnaCRM-Org/crm/issues/114) needs a denial target a guard can reach.

`RouteError` is the `errorElement` of the root route, both layout routes and every mapped
page, so it sits on the eager path. [ADR-017](./017-mui-theme-off-the-eager-path.md) keeps the
MUI theme engine off that path, and the designed pages need MUI and their illustrations. The
route contract has no `loader` or `action`, so a page or guard can only fail while rendering,
and react-router stores a render-thrown `Response` or `data()` value as-is: it never becomes a
router error response, and `isRouteErrorResponse` rejects it.

## Decision Drivers

- Product owner decision: 403, 404 and 500 to 599 route responses render the designed pages;
  every other error keeps `ErrorFallback`.
- The eager entrypoint stays free of MUI (the `performance-serving` pin and ADR-017), with no
  edit to `config/performance-budget.json`.
- No change to the `RecoverableError` contract, to `recoveryStrategyDetector` or to the
  bootstrap path.
- One footer and one `main` landmark per page, focus on the page heading, and route error
  reporting through `routeComposer.routeErrorHandler()` unchanged.

## Considered Options

1. **Option A** — a status dispatcher in front of the recovery model, rendering a lazy, themed
   page.
2. **Option B** — a new `status-page` recovery strategy inside `recoveryStrategyDetector` and
   `ErrorFallback`.
3. **Option C** — navigate to `/forbidden` or `/server-error` from the `errorElement`.

## Decision Outcome

Chosen option: **"Option A"**, because it gives status errors the designed pages while leaving
ADR-007's contract, detector and fallback untouched for every other error, and adds only a
detector and a loader to the eager path.

- `ErrorPageStatusDetector` (`src/components/error-boundary/error-page-status-detector.ts`)
  reads a status from a router error response, a render-thrown `Response` or a `data()` value,
  in that order, and maps 403 to `forbidden`, 404 to `notFound` and 500 to 599 to
  `serverError`. Every other input maps to `null`.
- `RouteError` becomes a two-way dispatcher. A variant renders `RouteErrorPage`; `null`
  renders `RouteErrorFallback`, which is the previous `RouteError` body moved unchanged, so
  every error the detector does not claim is classified and rendered exactly as before.
- `RouteErrorPage` lazy-loads `@/components/error-page` (chunk `error-page`) through
  `errorPageLoader`, a `ThemedChunkLoader` over a `ChunkRetryLoader`, and keys the page by
  `location.key`. When the chunk still fails after the retry, it renders `RouteErrorFallback`.
- `ThemedChunkLoader` and `ComponentModule` gain an optional props type parameter so the themed
  wrapper forwards `variant` and `landmark`; the existing call sites compile on the default.
- `/forbidden` and `/server-error` join the app shell's route contract as public lazy pages,
  next to the reworked catch-all 404 page; all three render the same `ErrorPage`.
- Reporting is unchanged: `routeComposer.routeErrorHandler()` reports every route error with
  `surface: 'route'` before the `errorElement` renders, and the page shows no status text,
  message or stack.
- **Warm-up after load.** `PostLoadPrefetcher` (`src/lib/reliability/post-load-prefetcher.ts`),
  attached once from `src/index.tsx` after `root.render`, waits for the window `load` event,
  then for the first `pointerdown` or `keydown`, then 2 000 ms more (a click that leaves the
  page at once never starts a fetch the navigation would abort — Firefox logs an aborted font
  download as a console error), then calls `errorPageLoader.load()` and a
  `FontFaceLoader` over the four Golos weights the page renders (`ERROR_PAGE_FONT_FACES`).
  Offline at that moment, it waits for the next `online` event. The trigger is interaction
  rather than a timer because only a client-side navigation can reuse the warmed chunk, and
  every navigation starts with an interaction: a timer made every page download and evaluate
  the chunk during its own load, which broke the `/sign-in` script budget (269 516 of
  265 000 bytes) and the 0.84 mobile performance floor. A page nobody touches never pays for
  it; the cost is that a session that goes offline before its first interaction falls back to
  `RouteErrorFallback` for a status error. Each target's rejection is swallowed, and
  `ChunkRetryLoader` forgets a failed promise, so a failed warm-up never poisons the later
  render. The three error routes name their chunk `error-page`, the same name as
  `errorPageLoader`, so one request warms `RouteError` and all three routes: a later 404, 403
  or 5xx, and a client-side navigation to `*`, `/forbidden` or `/server-error`, renders with
  no network request.

A 5xx route response therefore no longer offers an in-place **Try again**; it shows the
designed 5xx page, whose only action is the homepage link.

## Positive Consequences

- 403, 404 and 5xx route responses render the designed pages; every other route error renders
  the same `ErrorFallback` it rendered before this decision.
- The access layer (#114) gets `/forbidden`, and a guard can also throw
  `data(null, { status: 403 })` while rendering to reach the 403 page in place.
- The eager entrypoint grows only by the dispatcher, the detector, the loader and the catalog
  strings, and imports no MUI module.
- ADR-007's `RecoverableError` contract, `recoveryStrategyDetector` and `ErrorFallback` are not
  edited.
- On a slow or dropped connection the designed page still appears: everything it needs, the
  chunk, the MUI theme shell, the catalog strings, the inlined SVG illustration and its font
  faces, is already in memory once the warm-up has run.

## Negative Consequences

- A 5xx route response no longer offers an in-place **Try again**: the user goes home or
  reloads the page. A 5xx that arrives as a `{ retryable }` error or a chunk-load error, rather
  than as a status, keeps its retry or reload action.
- `ThemedChunkLoader` gains a props type parameter, widening the surface ADR-017 introduced.
- React caches the resolved lazy module, so after the error-page chunk fails twice, status
  errors render `ErrorFallback` for the rest of the session, the same degradation the lazy
  footer accepts. The warm-up narrows this to a status error in the first seconds after
  `load`; it does not close it.
- Every session downloads the `error-page` chunk (about 8 KB gzip) and any of the four Golos
  weights the current page has not rendered yet, whether or not an error happens. The
  worst-case growth stays inside every `config/performance-budget.json` and Lighthouse
  `resource-summary` budget, and no budget is raised. Save-Data is not honoured and
  `requestIdleCallback` is not used: `compat/compat` rejects `navigator.connection` and
  `requestIdleCallback` against the Safari 16.4 floor of
  [ADR-003](./003-browser-support-matrix.md), so the timing is a fixed delay after `load`.
- A request issued by the page's own nested lazy chunks after `load` can still be in flight
  when the warm-up starts, and shares bandwidth with it.
- A full document load of `/forbidden` or `/server-error` while offline still fails: the HTML
  shell is `Cache-Control: no-cache`, and only a service worker could answer it. That offline
  shell needs its own ADR and is left to a follow-up issue.
- An offline client-side navigation to a public route that was never warmed still reaches
  `ReloadingChunkLoader`, which reloads the document into the browser's offline page. Checking
  `navigator.onLine` before that reload is an ADR-007 and ADR-009 decision outside this one.
- Status is classified in two places: the status detector first, the recovery model second.

## Pros and Cons of the Options

### Option A

A status dispatcher in front of the recovery model renders a lazy, themed page.

#### Good (Option A)

- ADR-007's contract, detector and `ErrorFallback` stay untouched for every other error.
- The eager path gains only a detector and a loader; the page and MUI stay in the lazy chunk.
- The failing URL stays in the address bar and no history entry is added.

#### Bad (Option A)

- Two classification points: status first, recovery second.
- `ThemedChunkLoader` gains a props type parameter.
- A 5xx route response loses the in-place retry.

### Option B

A new `status-page` recovery strategy inside `recoveryStrategyDetector` and `ErrorFallback`.

#### Good (Option B)

- A single classification point.

#### Bad (Option B)

- Widens `RecoverableError` and the guard allowlists that validate it, rewriting ADR-007's
  contract.
- Pulls page UI into the eager `ErrorFallback`, or forces `ErrorFallback` lazy for every error,
  including the bootstrap failure it must render without a chunk.

### Option C

The `errorElement` navigates to `/forbidden` or `/server-error`.

#### Good (Option C)

- One rendering path for the status pages.

#### Bad (Option C)

- Loses the failing URL and adds a history entry.
- Flashes the error screen before the redirect, and loops when the target route itself fails.

## Links

- [ADR-003: Browser support matrix and polyfill strategy](./003-browser-support-matrix.md)
- [ADR-007: Reliability model](./007-reliability-model.md)
- [ADR-009: Runtime resilience](./009-runtime-resilience.md)
- [ADR-017: The MUI theme engine loads with the page chunk](./017-mui-theme-off-the-eager-path.md)
- [Issue #309: 404, 403 and 5xx error pages](https://github.com/VilnaCRM-Org/crm/issues/309)
- [Issue #114: access layer and RBAC](https://github.com/VilnaCRM-Org/crm/issues/114)
- [Issue #276: palette contrast exceptions](https://github.com/VilnaCRM-Org/crm/issues/276)
