---
status: 'complete'
workflowType: 'prd'
stepsCompleted:
  - 'step-01-init'
  - 'step-02-discovery'
  - 'step-02b-vision'
  - 'step-02c-executive-summary'
  - 'step-03-success'
  - 'step-04-journeys'
  - 'step-05-domain'
  - 'step-06-innovation'
  - 'step-07-project-type'
  - 'step-08-scoping'
  - 'step-09-functional'
  - 'step-10-nonfunctional'
  - 'step-11-polish'
  - 'step-12-complete'
project_name: 'crm'
date: '2026-10-01'
issue: 309
branch: 'feat/309-error-pages'
base: 'origin/main cff55203'
author: 'pm (John), autonomous run'
classification:
  projectType: 'web_app (React SPA) - user-facing error pages and route-error wiring'
  domain: 'general (internal CRM)'
  complexity: 'medium'
  projectContext: 'brownfield'
inputDocuments:
  - 'https://github.com/VilnaCRM-Org/crm/issues/309'
  - 'specs/309-error-pages/planning-artifacts/research-309-error-pages-2026-10-01.md'
  - 'specs/309-error-pages/planning-artifacts/brief-309-error-pages-2026-10-01.md'
  - 'Figma file xZ7ccrH6d4QyqLQsayFSEX, nodes 143:12154, 143:12166, 143:12178, 172:6675, 172:6914'
  - '.claude/react-sdlc.yml'
  - 'CLAUDE.md'
  - 'playwright.config.ts'
  - 'tests/visual/take-visual-snapshot.ts'
  - 'src/routes/route-paths.ts'
---

# Product Requirements Document: 404 / 403 / 5xx error pages from Figma (#309)

**Author:** pm (John), autonomous BMAD run. **Date:** 2026-10-01. **Issue:**
[#309](https://github.com/VilnaCRM-Org/crm/issues/309). **Status:** complete.

Predecessors: [technical research](./research-309-error-pages-2026-10-01.md) (cited "R§n") and
[product brief](./brief-309-error-pages-2026-10-01.md) (cited "B§n", goals G-1 to G-8, metrics
M-1 to M-11). A local, uncommitted pixel-level Figma note (cited "F§n") was the source of the
parity reference in appendix A, which now carries its measurements. This PRD carries the brief's goals into functional
requirements (section 9), its metrics into acceptance criteria, its constraints into NFRs
(section 10) and its risks into section 12. It does not re-open any product owner decision.

## 1. Executive Summary

A CRM user who follows a dead link, opens a page they may not see, or hits a failing server sees
today either an unstyled "page not found" block or the developer-facing `ErrorFallback` recovery
screen (R§3). Neither matches the VilnaCRM design, no "access denied" page exists, and the RBAC
work (#114) has no URL to send a refused user to.

This PRD specifies the three error pages drawn in Figma, **404** (desktop, tablet, mobile),
**403** and **5xx** (desktop), as one shared, presentational composition with three
configurations, wired in three places:

- the catch-all route (`ROUTE_PATHS.notFound`, `'*'`) renders the 404 page;
- `RouteError` renders the 404, 403 or 5xx page when a route error response carries status 404,
  403 or 500 to 599 (a router error response, or a `Response` or `data()` value a page or guard
  throws while rendering), and keeps today's `ErrorFallback` behaviour for every other error;
- two new public routes, `/forbidden` and `/server-error`, render the 403 and 5xx pages directly.

Scope is the content area plus the existing footer. The app header and the left sidebar drawn in
the frames are out of scope. A Fable-model reviewer verifies pixel parity against the frames
before the pull request for #309 is opened.

### What Makes This Special

- **One implementation, three configurations.** It follows how the design is built, and jscpd
  (threshold 0, `minTokens` 70) allows nothing else (R§7).
- **Zero eager MUI.** The page reaches `RouteError` only through a lazy, themed loader, so the
  eager graph keeps its single `@mui/*` edge and the raw entrypoint budget is not touched (R§8.1).
- **Measurable parity.** "Pixel-perfect" is defined as numeric tolerances per breakpoint
  (NFR-1 to NFR-4), not as a judgement call.

## 2. Project Classification

- **Project type:** web app (React 19 SPA, MUI 9 with Emotion, React Router 7, i18next).
- **Domain:** general (internal CRM). No regulated data is shown or collected.
- **Complexity:** medium. The visible surface is three pages, but the change crosses the eager
  bundle boundary (ADR-017), the reliability model (ADR-007, ADR-009), the a11y gates, the route
  coverage inventory and the visual baselines.
- **Context:** brownfield, on `origin/main` cff55203 (after #306 toolkit v0.6.0 and #307
  React 19.3 / ADR-017).

## 3. Success Criteria

### User Success

- A user who lands on an error page understands what happened from the heading and the
  description and gets home in one action (journeys J1 to J3).
- A keyboard or screen-reader user hears one heading and one description, never the digits or
  the art, reaches every action with Tab, and sees where focus is (FR-11).
- A denied user can tell "this page does not exist" (404) from "you are not allowed here" (403).

### Business Success

- RBAC (#114) gains a stable, public, browser-tested redirect target, `/forbidden`, and a
  server-error target, `/server-error`.
- The error states look like the rest of the product in both languages, uk first and en as the
  fallback.

### Technical Success

The brief's metrics are binding acceptance criteria, mapped in section 11:

- M-1 to M-3 (behaviour): FR-2 to FR-8, FR-10, FR-11.
- M-4 and M-5 (pixel parity): FR-12 to FR-15, FR-19, NFR-1 to NFR-5.
- M-6 to M-8 (quality floors): NFR-14 to NFR-18.
- M-9 (accessibility): FR-11, NFR-7 to NFR-9.
- M-10 and M-11 (bundle): NFR-10, NFR-11.

### Measurable Outcomes

- Every FR acceptance criterion holds on the PR head.
- Every CI check named in NFR-21 is green on the PR head, with no re-run used to mask a flake.
- The Fable parity report lists zero unresolved defects (FR-19).

## 4. Product Scope

### MVP (this pull request)

- One shared presentational error page in `src/components/error-page/`, fed one configuration
  per status (FR-1).
- The reworked 404 page in place at `src/components/not-found/not-found.tsx` (FR-2), and new 403
  and 5xx pages (FR-3, FR-4).
- Two new `ROUTE_PATHS` keys, `forbidden` and `serverError`, registered in the existing
  `app.shell` route contract (FR-5).
- A status-aware `RouteError` that renders the page through a lazy, themed loader (FR-6).
- The binding uk and en copy (FR-9), document titles (FR-10) and accessibility semantics
  (FR-11).
- The desktop, tablet and mobile compositions (FR-12 to FR-15) and the footer (FR-16).
- Unit, jest-axe, E2E, Playwright a11y and visual coverage and the route-coverage manifest rows
  (FR-17).
- Lighthouse desktop and mobile audits of `/forbidden` and `/server-error`, added to
  `lighthouse/constants.js` (FR-17, NFR-12), as the product owner's "reachable by
  E2E/visual/Lighthouse" decision and the accessibility definition of done require.
- Documentation and the reliability ADR update (FR-18).
- Fable pixel verification and a pull request that flags every design deviation (FR-19, FR-20).

### Growth (after #309, each its own issue)

- An access-request flow behind "Запросити доступ" (RBAC #114).
- The app shell drawn in the frames: header with search, notifications and user menu, and the
  left sidebar.
- Hover, focus and pressed designs.

### Out of Scope

- **The app shell.** Header (search, notifications, user) and left sidebar; no shell exists
  and it is a separate issue. Pixel comparison covers the content area only.
- **Any behaviour on "Запросити доступ".** No handler, navigation, request or analytics event.
  The TODO is tracked in these specs and the PR body (FR-8, FR-20), never as an inline code
  comment.
- **Parity claims for 403 and 5xx on tablet.** Frames 172:6702 (403) and 172:6941 (5xx) exist
  but are labelled "Помилка 404 tablet", so planning missed them. They draw a 636 px card where
  the 404 tablet frame draws 474 px; both pages reuse the 404 tablet rules (FR-13) and the
  wider card is a follow-up.

> Correction (review, 2026-10-07): the 403 (172:6730) and 5xx (172:6970) mobile frames also
> exist under the label "Помилка 404 mobile". The mobile composition now follows them: the
> 403 stacks its actions full width (20 px card inset, 6 px gap) with "Запросити доступ"
> first, the description keeps the 261.65 px text box, and each status carries its own
> title gap, action gap and bottom padding (404: 3.74 / 16 / 26.48, 403: 8 / 16 / 24,
> 5xx: 8 / 8 / 20).

- **Hover, pressed and disabled designs.** None are drawn; FR-7 and FR-11 set the minimum.
- **Changes to `ErrorFallback`, `UIErrorBoundary`, `AuthErrorBoundary` or the bootstrap path
  in `src/index.tsx`.** They keep handling every non-status error unchanged.
- **Changes to `recoveryStrategyDetector`.** The status branch sits before it, in `RouteError`.
- **Changes to `UIFooter`.** It is reused unchanged; a footer deviation the Fable review finds
  becomes a follow-up issue (FR-19).
- **Fixing the design palette's contrast.** White on `#1EAEFF` is tracked in #276 (NFR-8).
- **ui-toolkit `ui-error-boundary`, `ui-footer` and `ui-button`.** Not adopted, by ADR-016.
- **Storybook stories** for the error page. Optional; not required by any gate.
- **Mobile device-lane specs** (`tests/{e2e,visual}/mobile/**`) for the error pages. Optional.
- **Raising or lowering any budget or threshold.** No entry in
  `config/performance-budget.json`, `config/gate-thresholds.manifest.json` or the `quality.*`
  profile changes.

### Issue #309 Acceptance-Criteria Trace

| ID   | Issue #309 acceptance criterion                                               | FRs                       | NFRs                 |
| ---- | ----------------------------------------------------------------------------- | ------------------------- | -------------------- |
| AC-1 | Content area pixel-perfect at 1440 / 1024 / 375 (404) and 1440 (403, 5xx)     | FR-12 to FR-15, FR-19     | NFR-1 to NFR-5       |
| AC-2 | uk + en copy, locale parity gate green                                        | FR-9, FR-10               | NFR-14               |
| AC-3 | WCAG 2.1 AA: one `h1`, art hidden, keyboard-operable, contrast per standard   | FR-7, FR-8, FR-11         | NFR-7 to NFR-9       |
| AC-4 | Unit, E2E, visual and a11y coverage for every variant; route manifest updated | FR-17                     | NFR-5, NFR-9, NFR-15 |
| AC-5 | Issue scope: wiring, inert request access, 5xx copy, shell out of scope       | FR-2 to FR-6, FR-8, FR-16 | -                    |

### Product Owner Decision Trace

| ID    | Binding decision                                                                  | FRs               |
| ----- | --------------------------------------------------------------------------------- | ----------------- |
| UD-1  | Catch-all route renders the 404 page                                              | FR-2, FR-5        |
| UD-2  | `RouteError` renders 404 / 403 / 5xx for that status; other errors keep fallback  | FR-6              |
| UD-3  | New public routes `/forbidden` and `/server-error`                                | FR-3, FR-4, FR-5  |
| UD-4  | "Запросити доступ" rendered as designed, no code; TODO in PR and specs only       | FR-8, FR-20       |
| UD-5  | 5xx copy: "Помилка сервера" / "Сервер тимчасово недоступний. Спробуйте пізніше."  | FR-4, FR-9        |
| UD-6  | 404 copy: "Помилка 404" / "Сторінки не існує" / "На головну"                      | FR-2, FR-9        |
| UD-7  | 403 copy: "В доступі відмовлено", corrected "На жаль, …", outlined + primary pair | FR-3, FR-7, FR-9  |
| UD-8  | Scope: content area + existing footer; header and sidebar out                     | FR-12 to FR-16    |
| UD-9  | Fable pixel verification against the frames, then the PR                          | FR-19, FR-20      |
| UD-10 | Digits show `5xx` as designed, one "На головну" button on the 5xx page            | FR-4, FR-7, FR-12 |

## 5. User Journeys

### J1: Unknown URL (404, happy path)

A user opens `/does-not-exist` from a stale bookmark. The catch-all route lazy-loads the 404 page
inside `RootLayout`. Focus lands on the `h1` "Помилка 404"; the tab title reads
"Помилка 404 - VilnaCRM". The user activates "На головну" and the browser navigates to `/`.
Reveals FR-2, FR-7, FR-10, FR-11.

### J2: Denied page (403)

A guard redirects the user to `/forbidden`, or a page or guard throws
`data(null, { status: 403 })` (or a 403 `Response`) while rendering, which `RouteError`
catches. The route contract has no loaders, so a render throw is the path RBAC (#114) can use.
The 403 page shows "В доступі відмовлено", an outlined "На головну" and a primary
"Запросити доступ". The user presses "Запросити доступ": nothing happens, by design. They Tab
back to "На головну" and go home. Reveals FR-3, FR-6, FR-7, FR-8.

### J3: Server failure (5xx)

A page throws a 503 `Response` or `data()` value while rendering, or the app redirects to
`/server-error`. The 5xx page shows
"Помилка сервера" with one "На головну" button. Reveals FR-4, FR-6, FR-7.

### J4: Any other crash (unchanged)

A page throws a plain `Error`, a chunk fails to load, or a route throws a 401 response.
`ErrorFallback` renders exactly as today, with **Try again** or **Reload** where it applies.
Reveals FR-6 (negative cases).

### J5: Error inside the protected shell (edge case)

A protected page under `AppLayout` throws a 404 response. The page renders as a labelled
`region` inside `AppLayout`'s `main`, and the footer appears exactly once (AppLayout's).
Reveals FR-6, FR-11, FR-16.

### J6: Narrow phone (uk; en in the Fable pass)

A user opens `/forbidden` on a 320 px wide phone. The uk body wraps inside the card's 16 px text
inset, the card grows, the digits and the card stay fully visible, nothing scrolls horizontally,
and the buttons stay at least 44 px tall. Reveals FR-9, FR-14, NFR-7. The language is fixed at
build time (`src/i18n.js` reads `REACT_APP_MAIN_LANGUAGE`, uk, with no detector or switcher), so
every browser lane renders uk; the same layout in en is checked by the FR-19 en pass.

## 6. Domain Requirements

- **Accessibility:** WCAG 2.1 AA is the binding target
  (`docs/accessibility/acceptance-standard.md`); exceptions are scoped, carry a tracking issue
  and never cover a whole rule (NFR-8).
- **Localisation:** uk is the main language and en the fallback; both are mandatory and every
  key has one owning catalog (NFR-14).
- **Security:** every asset is same-origin under the CSP (`img-src 'self' data:`,
  `font-src 'self'`, `script-src 'self'`); no Figma MCP asset URL is referenced (NFR-20).
- **Privacy:** the pages render no user data and no error details; status pages never show an
  error message, stack or status text from the thrown response.

## 7. Innovation Analysis

Not applicable. This is a design implementation inside established patterns: the lazy themed
loader copies `footer-loader.ts`, and the status branch is a small detector in the style of
`recoveryStrategyDetector`.

## 8. Project-Type Requirements (React SPA)

- **Code splitting:** the page code, its MUI components, `UIFooter` and the decoration assets
  live only in lazy chunks. `RouteError` stays eager and gains only a status check and a lazy
  loader (NFR-10, NFR-11).
- **Theme delivery:** a page rendered by `RouteError` sits outside every page `ThemeProvider`
  (ADR-017), so it is rendered through `ThemedChunkLoader` (R§8.6).
- **Routing:** new routes are data in `src/routes/app-routes.ts`; `registry.ts`,
  `route-composer.tsx` and `routes.tsx` are not edited (R§7, ADR-drift trigger avoided).
- **Navigation:** "На головну" is a plain anchor (`href="/"`, full document navigation), like
  today's 404 and `ErrorFallback`. It is the only safe navigation out of a crashed route tree.
- **Fonts:** Golos 400, 500, 600 and 700 are already served same-origin from
  `src/styles/fonts.css`; no font file is added (R§8.5).
- **Browser support:** Baseline 2023 (ADR-003); no Web API outside the matrix (`compat/compat`).

> Assumption: the responsive switch points use the CRM breakpoints (`xs 320, sm 480, md 768,
lg 1024, xl 1440`): the mobile composition below 768 px, the tablet composition from 768 px to
> 1024 px inclusive, and the desktop composition above 1024 px (architecture D-8, which refined
> an earlier "desktop from 1440" draft). Parity is claimed only at 375, 1024 and 1440.

## 9. Functional Requirements

Each FR states a capability, its acceptance criteria, its test cases and its verification. Test
cases are labelled `P` (positive), `N` (negative) and `E` (edge). "Unit" means Jest with Testing
Library; "E2E", "a11y-e2e" and "visual" mean the Playwright lanes; "Fable" means the parity
review in FR-19. A CI check is written as `<workflow> / <job>`.

### 9.1 Shared composition

#### FR-1: One shared error page with three configurations

The product renders all three error pages from one presentational component and one
configuration per status.

- **Acceptance:**
  - A single component renders digits, yellow tab, card (title, description, actions) and the
    decoration layer; the 404, 403 and 5xx pages differ only by configuration.
  - The configuration per status holds: the three digit glyphs, the digit fill and shadow
    colours, the title key, the description key, the page-title key and the action set.
  - Configuration values are data (no function-valued properties in `.ts` files).
  - The component accepts the landmark (`main` or `region`, the existing `FallbackLandmark`
    type) and whether the footer is rendered (FR-16).
  - jscpd reports 0 clones over `src` (NFR-16).
- **Test cases:**
  - P1 (unit): rendering each of the three configurations shows the configured title and
    description keys and the configured action set.
  - P2 (unit, isolated module): the configuration table equals the expected literal table,
    loaded inside the test so static mutants are killed.
  - N1 (unit): no configuration renders a second `h1`, a `role="alert"` or an error message.
  - E1 (unit): the same component renders as `main` and as a labelled `region`.
- **Verify:** `unit testing / unit`; `static testing / static` (`lint-dup`).

### 9.2 Pages and routes

#### FR-2: 404 page on the catch-all route

A user who opens any unknown path sees the designed 404 page.

- **Acceptance:**
  - `ROUTE_PATHS.notFound` (`'*'`) still loads `@/components/not-found/not-found` with
    `webpackChunkName: "not-found"`, `guard: 'public'`, and the page renders the 404
    configuration.
  - Digits `4 0 4`, title "Помилка 404", description "Сторінки не існує", one primary
    "На головну".
  - `UIBackToMain`, the `h4`-styled heading and the text button are removed from the page.
- **Test cases:**
  - P1 (E2E): `/definitely-not-a-route` shows `main h1` with the 404 title key through
    `t()`, the description, and exactly one `main a[href="/"]`.
  - P2 (unit, routes): an unknown path renders the not-found page module.
  - N1 (unit): the page renders no back-to-main link and no `button` element.
  - E1 (E2E): a deep unknown path (`/a/b/c?x=1#y`) renders the same page.
  - E2 (E2E): `/__memlab_away__` (the memlab away page) renders the 404 page without console
    output.
- **Verify:** `unit testing / unit`; `e2e testing / test`.

#### FR-3: 403 page on `/forbidden`

A user sent to `/forbidden` sees the designed 403 page.

- **Acceptance:**
  - Digits `4 0 3` in `#1B2327` with a `#999999` shadow, title "В доступі відмовлено",
    description "На жаль, у вас немає прав доступу до цієї сторінки".
  - An outlined "На головну" followed by a primary "Запросити доступ" in one row (FR-7).
  - The route is public: it renders without an auth token and does not redirect to `/sign-in`.
  - The HTTP response for `/forbidden` is the SPA shell (status 200 from `serve`); the page is
    a client-side state, not a server 403.
- **Test cases:**
  - P1 (E2E): `/forbidden` without auth shows the 403 `h1`, both actions and the footer.
  - P2 (E2E): `/forbidden` with a seeded auth token shows the same page (no redirect).
  - N1 (E2E): `/forbidden/` (trailing slash) and `/Forbidden` behave as React Router matches
    them; the test pins the observed result.
  - E1 (E2E): a reload on `/forbidden` keeps the 403 page.
- **Verify:** `e2e testing / test`; `accessibility testing / a11y-e2e`.

> Assumption: route matching for `/forbidden` and `/server-error` is React Router's default
> (case-insensitive, trailing slash tolerated); no custom matching is added.

#### FR-4: 5xx page on `/server-error`

A user sent to `/server-error` sees the designed 5xx page.

- **Acceptance:**
  - Digits `5 x x` (lower-case `x`) in `#FFC01E` with a `#CC9300` shadow.
  - Title "Помилка сервера", description "Сервер тимчасово недоступний. Спробуйте пізніше.",
    one primary "На головну".
  - No **Try again** or **Reload** action (UD-5, UD-10).
  - Public route, like FR-3.
- **Test cases:**
  - P1 (E2E): `/server-error` shows the 5xx `h1`, one `a[href="/"]` and the footer.
  - N1 (E2E): the page has no `button` element.
  - E1 (unit): the digit glyphs are exactly `5`, `x`, `x` (not `X`, not translated).
- **Verify:** `e2e testing / test`; `unit testing / unit`.

#### FR-5: Route registration

Developers and RBAC (#114) can address the 403 and 5xx pages by stable route keys.

- **Acceptance:**
  - `ROUTE_PATHS` gains `forbidden: '/forbidden'` and `serverError: '/server-error'`; existing
    keys and values are unchanged.
  - The `app.shell` contract in `src/routes/app-routes.ts` gains two `guard: 'public'` routes
    whose `load` is a dynamic `import()` named `webpackChunkName: "forbidden"` and
    `"server-error"`.
  - `src/routes/registry.ts`, `src/routes/route-composer.tsx` and `src/routes/routes.tsx` are
    not edited.
  - The composer attaches an `errorElement` to both new routes, as to every mapped page.
- **Test cases:**
  - P1 (unit): `route-paths.test.ts` asserts both new values; `registry.test.ts` finds both
    routes in `app.shell` with `guard: 'public'`.
  - P2 (unit, tooling): `performance-serving.test.ts` pins both `webpackChunkName` imports and
    still pins the `not-found` import path.
  - N1 (unit): neither new route is wrapped in `ProtectedRoute`.
  - E1 (CI): `make check-e2e-route-coverage` passes with the new rows (FR-17) and fails if a
    row is removed.
- **Verify:** `unit testing / unit`; `e2e testing / test` (route-coverage step).

### 9.3 Route error wiring

#### FR-6: Status-aware `RouteError`

A route error response with a known status shows the matching designed page; every other error
keeps the existing recovery screen.

- **Acceptance:**
  - Status 404 renders the 404 page; 403 renders the 403 page; 500 to 599 inclusive render the
    5xx page.
  - The status is read from a router error response (`isRouteErrorResponse`), a thrown
    `Response` (`.status`) or a `data()` value (`type === 'DataWithResponseInit'`,
    `init.status`). The route contract has no `loader` or `action`, so a page or guard throwing
    during render is the reachable path today; react-router stores a render throw as-is, which
    is why the router-response check alone would never fire. Router-produced responses serve
    future loaders.
  - Every other value renders `ErrorFallback` exactly as today: other 4xx (400, 401, 405, 499),
    values outside 400 to 599 (399, 600), non-response errors, chunk-load errors and
    `{ retryable }` errors.
  - The status page is loaded lazily under `<Suspense fallback={<RouteFallback />}>` through a
    themed loader built like `footer-loader.ts`, named `webpackChunkName: "error-page"`.
  - If the error-page chunk fails to load after its retry, `RouteError` renders `ErrorFallback`
    for the original error instead (no blank screen, no unhandled rejection).
  - The `landmark` prop is forwarded: `main` at the root and public routes, a labelled `region`
    under `AppLayout`.
  - Reporting is unchanged: `routeComposer.routeErrorHandler()` still reports every route error
    with `surface: 'route'`; `RouteError` stays presentational.
  - The status page shows no status text, message or stack from the thrown response.
  - The page re-mounts when `location.key` changes, as `ErrorFallback` does today.
- **Test cases:**
  - P1 (unit, `createMemoryRouter`): page components that throw `data(null, { status })` and
    `new Response(null, { status })` during render, for 403, 404, 500 and 599, render the
    matching page (`findByRole('heading', { level: 1 })`); loaders throwing the same values
    (router-converted) do too.
  - P2 (unit): the status detector returns the page variant for 403, 404, 500 and 599, and no
    variant for 400, 401, 405, 499, 600, 399, a plain `Error`, `null` and a string, for each
    input shape (router literal, `Response`, `data()`; 600 has no `Response` form because the
    constructor rejects it) (boundary matrix, kills `EqualityOperator` mutants).
  - P3 (unit): `detect()` reads a raw `new Response(null, { status: 404 })` and a raw
    `data(null, 404)` directly; `data(null)` without a status and an object with another
    `type` return no variant.
  - N1 (unit): a thrown `Error('boom')` renders `ErrorFallback` with **Try again** (strategy
    `reset`), unchanged.
  - N2 (unit): a 401 response renders `ErrorFallback` with the navigate-home message.
  - N3 (unit): a chunk-load error renders `ErrorFallback` with **Reload**.
  - E1 (unit): a failing error-page loader renders `ErrorFallback` for the original 404.
  - E5 (unit): a page that throws a 401 `Response` during render renders `ErrorFallback`
    (strategy `reset`, as today).
  - E2 (unit): a 404 thrown under `AppLayout` renders a `region` named by the `h1`, and the
    page contains no second `main`.
  - E3 (unit): the two existing `route-error.test.tsx` cases that pin "404 → navigate-home" and
    "503 → in-place retry" are rewritten to the new behaviour, not deleted.
  - E4 (unit): `onCaughtError` is passed and asserted per test; no file-wide console spy.
- **Verify:** `unit testing / unit`; `integration testing / integration` (route reporting
  chain); `mutation testing`.

### 9.4 Actions

#### FR-7: Actions per variant

A user can leave every error page with one visible, labelled action.

- **Acceptance:**
  - 404 and 5xx: one primary "На головну" link, `href="/"`, fill `#1EAEFF`, label `#FFFFFF`.
  - 403: an outlined "На головну" link (`#FFFFFF` fill, 1 px `#969B9D` border, label
    `#1B2327`) followed by the primary "Запросити доступ" button, 8 px apart, centred as a row.
  - Every home action is an anchor with `href="/"`; activating it navigates to `/` (which then
    applies the existing auth redirect).
  - Labels have no text transform, letter-spacing 0, Golos.
  - Hover: the primary fill changes to the existing hover token `#00A3FF`; the outlined button
    keeps its colours (no hover design exists).
- **Test cases:**
  - P1 (E2E): clicking "На головну" on each page lands on `/` or on its auth redirect.
  - P2 (E2E): keyboard only: Tab reaches "На головну", Enter navigates.
  - N1 (unit): the 404 and 5xx pages render no "Запросити доступ".
  - E1 (unit): on the 403 page the DOM order is "На головну" then "Запросити доступ".
- **Verify:** `e2e testing / test`; `unit testing / unit`; visual.

#### FR-8: Inert "Запросити доступ"

A user sees the "Запросити доступ" action exactly as designed, and it does nothing.

- **Acceptance:**
  - It is a native `<button type="button">` with the visible, localised label as its accessible
    name and `aria-disabled="true"`; it is never `disabled`, so it stays focusable and in the tab
    order, and it is pixel-identical to the design (MUI adds no styling for `aria-disabled`).
    Accessibility-lead decision (2026-10-01): a control that does nothing is announced as
    unavailable rather than presented as an active action.
  - It has no click handler, no `href`, no form, no navigation and no network request.
  - The source carries no TODO comment; the TODO is recorded in this PRD (section 13) and in
    the PR body (FR-20).
- **Test cases:**
  - P1 (unit): `getByRole('button', { name: <label> })` exists with `type="button"` and
    `aria-disabled="true"`, has no `disabled` attribute and takes focus.
  - N1 (E2E): the button carries `aria-disabled="true"`; clicking it and pressing Enter and
    Space leave the URL, the `h1` and the request log unchanged, with zero console output
    (console fixture).
  - E1 (static): a search of the change set finds no `TODO` comment in `src/` for this button.
- **Verify:** `unit testing / unit`; `e2e testing / test`; PR review.

> Decision (accessibility lead, supersedes the earlier enabled-button assumption): the button
> carries `aria-disabled="true"` and no `disabled` attribute, so it keeps the design's active
> primary look, stays focusable and in the tab order, and tells assistive technology it is
> unavailable until RBAC #114 supplies the flow; the gap is recorded in the PR.

### 9.5 Copy, titles and semantics

#### FR-9: Bilingual copy

A user reads every string in uk, or in en when en is selected.

- **Acceptance:** the strings equal the table below, character for character.

| Variant | Lang | Title (`h1`)         | Description                                                    | Actions                                 |
| ------- | ---- | -------------------- | -------------------------------------------------------------- | --------------------------------------- |
| 404     | uk   | Помилка 404          | Сторінки не існує                                              | На головну                              |
| 404     | en   | Error 404            | This page does not exist                                       | Go to homepage                          |
| 403     | uk   | В доступі відмовлено | На жаль, у вас немає прав доступу до цієї сторінки             | На головну (outlined), Запросити доступ |
| 403     | en   | Access denied        | Unfortunately, you do not have permission to access this page  | Go to homepage, Request access          |
| 5xx     | uk   | Помилка сервера      | Сервер тимчасово недоступний. Спробуйте пізніше.               | На головну                              |
| 5xx     | en   | Server error         | The server is temporarily unavailable. Please try again later. | Go to homepage                          |

- **Acceptance (catalog rules):**
  - Every key has exactly one owning catalog; `buttons.back_to_main` and
    `error_boundary.go_home` are not re-declared (values may be reused, keys may not).
  - `route_fallback.loading` keeps an owner and its current values.
  - `src/i18n/localization.json` is regenerated with `make i18n-generate`.
  - The digits are literal glyphs, not translated.
  - Each variant also has a visually hidden status-code line (FR-11), key
    `error_page.<variant>.code`: uk "Код помилки: 404", "Код помилки: 403", "Код помилки: 5xx";
    en "Error code: 404", "Error code: 403", "Error code: 5xx".
- **Test cases:**
  - P1 (unit): each variant renders its uk strings; switching the language to en renders the
    en strings without a reload.
  - P2 (CI): `make lint-i18n` passes.
  - N1 (CI): removing any en key makes `make lint-i18n` fail (the gate's own fixtures).
  - E1 (unit): the uk 403 description contains "На жаль," and not "Нажаль".
  - E2 (unit): no console output for missing keys under the console gate.
- **Verify:** `static testing / static` (`lint-i18n`); `unit testing / unit`.

> Assumption: the uk 403 body uses the correct orthography "На жаль" instead of the design's
> "Нажаль", and the deviation is flagged for design in the PR.
>
> Assumption: the en home label is "Go to homepage", the established en value of
> `not_found.cta` and `error_boundary.go_home`. The en 404 and 403 strings above are final for
> this PR; the en 5xx strings are the product owner's.

#### FR-10: Document title

The browser tab names the error.

- **Acceptance:** each page sets `document.title` to "<title> - VilnaCRM" through
  `usePageTitle`, updates it on a language change, and resets it to "VilnaCRM" on unmount.
- **Test cases:**
  - P1 (unit): each variant calls `usePageTitle` with its own title key.
  - E1 (E2E): on `/forbidden` the title is "В доступі відмовлено - VilnaCRM".
- **Verify:** `unit testing / unit`; `e2e testing / test`.

#### FR-11: Accessible structure

A screen-reader or keyboard user gets one heading, the description, and operable actions.

- **Acceptance:**
  - Exactly one `h1` (the title), with `tabIndex={-1}`, focused on mount; no positive
    `tabindex` anywhere.
  - The `h1` is a programmatic focus target only: it is not in the Tab sequence and is not an
    operable control, so WCAG 2.4.7 asks no indicator of it. It renders `outline: none` on
    `:focus`, because browsers match `:focus-visible` on script focus at page load (measured in
    Chromium 149) and the frames draw no outline around the title.
  - The page is a `main` landmark, or a `region` labelled by the `h1` under `AppLayout`
    (FR-6); it carries `lang` with the resolved i18next language.
  - The digits are `aria-hidden="true"` and are not headings; every decoration is
    `aria-hidden="true"` (inline SVG also `focusable="false"`; image form `alt=""`).
  - The status code the digits show is exposed once as text: a visually hidden `p` right after
    the `h1` reads `error_page.<variant>.code` ("Код помилки: 404" / "403" / "5xx"; en "Error
    code: …"), so on the 403 and 5xx pages, whose titles do not name the code, a screen-reader
    user still hears it (WCAG 1.3.1). It is absolutely positioned and clipped, so it changes no
    pixel and no card rhythm.
  - The description is plain text (not `role="alert"`, not live).
  - Accessible names equal the visible labels (WCAG 2.5.3).
  - Both button styles show a visible `:focus-visible` outline at least 2 px wide with at least
    3:1 contrast against `#FFFFFF` and `#FBFBFB` (WCAG 2.4.7, 1.4.11). This applies to the
    actions, never to the `h1`.
  - Tab order: home action, then "Запросити доступ" (403), then the footer links.
  - Touch targets are at least 44 x 44 CSS px at every breakpoint.
- **Test cases:**
  - P1 (unit): `getAllByRole('heading', { level: 1 })` has length 1 and has focus after mount.
  - P2 (jest-axe): the three variants have 0 violations in
    `tests/unit/a11y/ui-components.a11y.test.tsx`.
  - P3 (a11y-e2e): `/forbidden`, `/server-error` and the unknown path have 0 axe violations in
    chromium, firefox and webkit, apart from the two scoped exceptions in NFR-8.
  - N1 (unit): the digit glyphs sit only inside the `aria-hidden` `#error-page-digits` box, and
    the status code reaches the accessibility tree exactly once, through the visually hidden
    `error_page.<variant>.code` line (`getByText('Код помилки: 403')` and the 404 / 5xx twins).
  - E1 (a11y-e2e): `expectTabOrder` on `/forbidden` visits the home link, "Запросити доступ"
    and both footer links in order, each `:focus-visible` and declared `visibleFocus: true`, so
    the computed style must change on focus and a missing ring fails; on the catch-all and
    `/server-error` a single-stop `expectTabOrder` with `visibleFocus: true` checks the
    contained home link.
  - E4 (a11y-e2e): at 839 x 412 (the Pixel 7 descriptor rotated to landscape) right after
    `page.goto` on each of the three pages the `h1` is focused and its box lies fully inside the
    viewport.
  - E3 (a11y-e2e): right after `page.goto` on each of the three pages the `h1` is the active
    element and its computed `outline-style` is `none` in chromium, firefox and webkit.
  - E2 (unit): under `AppLayout` the region is named by the `h1` text.
- **Verify:** `unit testing / unit`; `accessibility testing / a11y-unit`;
  `accessibility testing / a11y-e2e`.

> Assumption: on a short viewport (for example a landscape phone, 412 px tall) the shared
> `useFocusOnMount` focuses the `h1` without `preventScroll`, so the browser scrolls the `h1`
> (430 px below the content top under the tablet composition) into view and the page opens
> scrolled, with the digits partly above the fold. This is accepted: the `h1`, the description
> and the actions are the content a user needs, the shared hook stays unchanged for every page,
> and E4 pins that the focus target is visible. The behaviour is flagged for design in the PR
> and listed for the Fable reviewer.

### 9.6 Visual composition

All geometry below is relative to the **composition origin** O: x at the card's left edge, y at
the top of the digit frame. Appendix A holds the full reference; F§1 to F§3 are the source.

#### FR-12: Desktop composition (above 1024 px; frames 143:12154, 172:6675, 172:6914)

- **Acceptance:**
  - Composition 614 x 552; paint order bottom to top: yellow tab, dashed curve, digits, card,
    diamond, dot, dot columns.
  - Digits: Golos 700, 244.5 px, line height 293.4 px, letter-spacing 0, `text-shadow`
    `0 4px 0 <shadow>`; glyph boxes at x 0 / 147 / 301 inside a 466 x 330 frame at O(74, 0);
    middle glyph 36 px lower; the row is left-aligned in the frame (not centred).
  - Fill / shadow: 404 `#1EAEFF` / `#0E87CC`; 403 `#1B2327` / `#999999`; 5xx `#FFC01E` /
    `#CC9300`.
  - Card at O(0, 330), 614 x 222, `#FFFFFF`, 1 px inside border `#EAECEE`, radius 16, shadow
    `0 4px 31px 0 rgba(55, 64, 78, 0.07)`, overflow hidden.
  - Card rhythm: top 29, title 43, gap 6, description 26, gap 24, actions 62, bottom 32;
    children centred horizontally.
  - Title Golos 600 36 px, line box 43, `#000000`. Description Golos 400 16 / 26, `#1A1C1E`,
    centred. Button label Golos 600 18 px, line box 22.
  - Title and description keep a 24 px text inset from the card's inner edges
    (`max-width: calc(100% - 48px)`), wrapping inside it when longer; the actions row is not
    inset.
  - Buttons: 404 / 5xx primary 165 x 62; 403 outlined 165 x 62 then primary 228 x 62, gap 8;
    radius 57; padding 20 / 32.
  - Yellow tab at O(37, 301), 540 x 225, `#FFC01E`, radii 32 32 0 0, below the card.
  - Decorations per appendix A.1: curve `#00A3FF` at opacity 0.3, diamond `#01A6FF`, dot
    `#0B315E`, four dot columns `#E1E7EA`.
  - The 403 diamond and dot use the 404 / 5xx relative placement.
- **Test cases:**
  - P1 (visual): 404 at 1440, 403 at 1440 and 5xx at 1440 match their committed baselines in
    chromium, firefox and webkit with 0 diff (NFR-5).
  - P2 (Fable): every appendix A.1 element is within the NFR-1 to NFR-3 tolerances.
  - P3 (unit, isolated module): the style builder output pins every token above.
  - E1 (E2E): at 1920 x 1080 the card (the `h1`'s parent) is 614 px wide and its horizontal
    centre is at 960 ± 1 px on all three pages; nothing stretches.
- **Verify:** `visual tests / test`; `e2e testing / test`; Fable report; `unit testing / unit`.

> Assumption: the 403 frame's diamond and dot are frame-level nodes left at the 5xx coordinates
> (F§6.3); the 403 page uses the 404 / 5xx placement relative to the digits.

#### FR-13: Tablet composition (768 to 1024 px; frame 143:12166, 404 only)

- **Acceptance:**
  - Digits identical to desktop, frame at O(4, 0).
  - Card at O(0, 330), 474 x 235, same fill, border, radius and shadow as desktop.
  - Card rhythm: top 24, title 43, gap 4, description 30, gap 24, button 70, bottom 40.
  - Description Golos 400 18 / 30. Button 189 x 70 fixed height, padding 20 / 44.
  - Same 24 px text inset as desktop; the actions row is not inset.
  - Yellow tab at O(26, 301), 421 x 225.
  - Decorations per appendix A.2 (x-stretched by 1.0185 relative to desktop).
  - 403 and 5xx use the same tablet rules with their own digits, copy and actions.
- **Test cases:**
  - P1 (visual): 404 at 1024 matches its baseline in three engines.
  - P2 (Fable): appendix A.2 elements within tolerance at 1024.
  - E1 (visual, E2E): 403 at 1024 x 1366 renders the two-button row on one line inside the
    474 card, without wrapping or overflow. Tablet buttons carry 44 px side padding, so the uk
    row is about 189 + 8 + 252 = 449 px, under the 472 px inside the card border (the row has no
    text inset). The visual lane holds a `forbidden-tablet` regression baseline (no parity
    claim, no frame exists); the E2E spec, in uk like every browser lane, asserts the two
    buttons share one top and lie inside the card.
  - E2 (E2E): at 1024 x 1366 the uk 403 description keeps at least 24 px from each card edge.
  - E3 (Fable en pass, FR-19): the en row (estimated 442 to 460 px) stays on one line inside
    the card at 1024; this is checked on `make start` with `REACT_APP_MAIN_LANGUAGE=en`, because
    no browser lane renders en.
- **Verify:** `visual tests / test`; `e2e testing / test`; Fable report.

> Assumption: the tablet card is centred in the page, not offset for the out-of-scope sidebar
> (R§4.6); the Fable reviewer is told this so it is not reported as a defect.

#### FR-14: Mobile composition (below 768 px; frame 143:12178, 404 only)

- **Acceptance:**
  - Digits Golos 700 154.462 px, line height 185.355 px, shadow `0 2.527px 0`; glyph boxes at
    x 27.739 / 120.606 / 217.896 inside a 344.435 x 243.913 frame at O(2.956, 0); glyph tops at
    y 14.582 (outer glyphs, boxes 97 x 186) and 37.324 (middle glyph, box 101 x 186), so the
    middle glyph sits 22.742 px lower. Desktop and tablet tops are 0 / 36 / 0.
  - Card at O(0, 243.912), 350.348 x 173.696, border 0.739 px `#EAECEE`, radius 11.826, shadow
    `0 2.957px 22.913px 0 rgba(55, 64, 78, 0.07)`.
  - Card rhythm: top 26.48, title 26, gap 3.74, description 25, gap 16, button 50, bottom 26.48.
  - Title Golos 700 22 px; description Golos 400 15 / 25; button 132 x 50, padding 16 / 24,
    label Golos 500 15 / 18.
  - Title and description keep a 16 px text inset from the card's inner edges
    (`max-width: calc(100% - 32px)`); the actions row is not inset.
  - Yellow tab at O(19.216, 222.478), 311.174 x 166.304, radii 23.652 23.652 0 0; it is placed
    by its insets from the card edges (left 19.216, right 19.958), so it always stays behind the
    card when the composition narrows below 375 px.
  - Decorations per appendix A.3: curve 360 x 200, diamond 29.565; the dot and the four vertical
    columns are not rendered; four horizontal dot rows (10, 8, 6, 4 dots) below the card,
    centred, the first 19.78 px below the card, the four spanning 59.09 px (y 437.387 to 496.478
    relative to O).
  - From 320 to 374 px the composition fits the viewport: no horizontal page scroll, the card
    and digits are fully visible, the actions are at least 44 px tall, and the yellow tab's
    horizontal extent stays inside the card's. Geometry is not parity-checked in that range.
  - 403 and 5xx use the same mobile rules; the 403 row may wrap to two lines below 401 px of
    card content width, keeping the 8 px gap.
- **Test cases:**
  - P1 (visual): 404 at 375 matches its baseline in three engines.
  - P2 (Fable): appendix A.3 elements within the NFR-3 tolerance at 375.
  - E1 (E2E): at 320 x 640, `document.documentElement.scrollWidth` equals the viewport width on
    all three pages.
  - E2 (E2E): at 320 x 640 and 375 x 812 the uk 403 and 5xx descriptions wrap, the card height
    grows, the actions stay inside the card, and the description's box keeps at least 16 px from
    each card edge. The en wrap is checked in the FR-19 en pass.
  - E3 (E2E): at 320 x 640 the yellow tab's bounding box lies within the card's left and right
    edges on all three pages.
  - E4 (E2E): at 320 x 640 each glyph span of `#error-page-digits` and the card's box lie
    within x 0 to 320 on all three pages. The landmark's `overflow-x: clip` keeps overflow out of
    `scrollWidth`, so E1 alone cannot see a clipped glyph.
  - N1 (unit or E2E): at 375 no dot column or dot is rendered visibly.
- **Verify:** `visual tests / test`; `e2e testing / test`; Fable report.

> Assumption: the sub-pixel Figma values at 375 (scales 0.7391 and 0.6318) are reproduced to two
> decimals; browser rounding inside the NFR-3 tolerance is not a defect.

#### FR-15: Placement in the page

- **Acceptance:**
  - The page background is `#FBFBFB` from the top of the content area to the footer.
  - The composition is centred horizontally on the shared card and digit axis; the decorations
    overflow asymmetrically and are clipped by the page, never causing horizontal scroll.
  - The digit frame top sits 76 px below the content top on desktop and tablet, 43.61 px on
    mobile.
  - The content area grows to push the footer to the bottom of the viewport when the content is
    shorter than the viewport; otherwise the footer follows with at least 121 px (desktop,
    tablet) or 73.91 px (mobile) below the lowest decoration.
- **Test cases:**
  - P1 (Fable): the 76 px and 43.61 px offsets hold within NFR-1 / NFR-3.
  - E1 (E2E): at 1440 x 600 the footer top is at or below the lowest decoration's bottom plus
    121 px, nothing overlaps, and `scrollWidth` equals the viewport width.
  - E2 (E2E): at 1440 x 1400 the footer's bottom edge is at the viewport bottom (± 1 px).
- **Verify:** `e2e testing / test`; Fable report.

> Assumption: with the header and sidebar out of scope, the offsets are the values 5xx desktop
> and the tablet frame share (R§4.6), and the minimum footer gaps are the smallest gaps drawn
> (121 px on the 403 desktop frame, 73.91 px on the mobile frame, from the last dot row's
> bottom at 698.09 to the footer at 772).

#### FR-16: Footer exactly once

- **Acceptance:**
  - When the page is the `main` landmark (catch-all, `/forbidden`, `/server-error`, root and
    layout-level route errors), it renders the existing `UIFooter` once, below the content,
    full width, lazy.
  - When it renders as a `region` inside `AppLayout`, it renders no footer; AppLayout's footer
    is the only one.
  - `UIFooter` itself is unchanged.
- **Test cases:**
  - P1 (unit): `getAllByRole('contentinfo')` has length 1 in both landmark modes.
  - P2 (a11y-e2e): `openRoute` finds `contentinfo` on both new routes.
  - N1 (unit): the region mode renders no `footer` element.
- **Verify:** `unit testing / unit`; `accessibility testing / a11y-e2e`.

### 9.7 Coverage, documentation and delivery

#### FR-17: Test coverage and the route manifest

- **Acceptance:**
  - Every new `src` file has a direct unit test under the mirrored `tests/unit/` path.
  - `not-found.test.tsx` is reworked; `route-error.test.tsx` and `route-error.router.test.tsx`
    cover FR-6; `route-paths`, `registry`, `routes` and app-level tests know the new modules.
  - jest-axe covers the three variants.
  - E2E covers the 404 rewrite and the two new routes, importing `test` from
    `@tests/e2e/utils/fixtures`.
  - `routes.a11y.spec.ts` scans `forbidden` and `serverError` (`ready: 'main h1'`), and
    `error-pages-text-spacing.a11y.spec.ts` applies WCAG 1.4.12 spacing on `/forbidden` (NFR-7).
  - Visual specs cover 404 at 1440, 1024 and 375, 403 at 1440 and 1024 (the 1024 screen is a
    regression baseline without a parity claim) and 5xx at 1440; the six existing not-found
    baselines are regenerated.
  - `lighthouse/constants.js` audits `/forbidden` and `/server-error` beside `/`, `/sign-up`
    and `/sign-in`, and `tests/unit/tooling/lighthouse-constants.test.ts` pins the five URLs.
  - `tests/e2e/route-coverage.tsv` has e2e, visual and a11y rows for `forbidden` and
    `serverError`, and no `allowlisted` row for either.
- **Test cases:**
  - P1 (CI): `make check-e2e-route-coverage` passes.
  - N1 (CI): deleting one new row makes it fail (gate fixtures, `tests/bats/ci_scripts.bats`).
- **Verify:** `unit testing / unit`; `e2e testing / test`; `visual tests / test`;
  `accessibility testing / *`.

> Assumption: the new visual screens use the frame widths with the frame heights: 1440 x 1000
> for 404, 1440 x 940 for 403 and 5xx, 1024 x 1366 and 375 x 1082. Snapshots are full-page, so
> the heights only fix the viewport the Fable crops are compared against.

#### FR-18: Documentation and the reliability ADR

- **Acceptance:**
  - An ADR records that 403, 404 and 500 to 599 route error responses render the status pages
    and that the in-place **Try again** for 5xx route responses is gone: either an amendment of
    ADR-007 or a new ADR-018, with `Deciders: [@kravalg](https://github.com/kravalg)`, all
    template sections and its `docs/adr/README.md` row.
  - `src/routes/README.md` lists the new routes in the `app-routes.ts` row.
  - CLAUDE.md, AGENTS.md and `.github/copilot-instructions.md` pattern 14 describe the status
    branch.
  - `docs/accessibility/acceptance-standard.md` "Current exceptions" counts the NFR-8 entry.
  - `make lint-docs` passes.
- **Test cases:**
  - P1 (CI): `make lint-adr`, `make lint-doc-links` and `make lint-doc-references` pass.
  - N1 (review): no doc still says a 5xx route response offers **Try again**.
- **Verify:** `static testing / static`; PR review.

#### FR-19: Fable pixel-parity verification

- **Acceptance:**
  - After implementation and before the PR, a Fable-model reviewer compares the rendered pages
    with the five Figma frames at 1440, 1024 and 375 using the NFR-1 to NFR-4 method.
  - The reviewer receives appendix A, the assumptions of FR-12 to FR-15 and the copy
    deviations of FR-9, so intended deviations are not reported as defects; the deviations
    that would otherwise enter the raster ratio are painted out by the NFR-4 per-frame masks,
    not argued in prose.
  - The report lists each defect with element, breakpoint, measured value, expected value and
    tolerance. A content-area defect is fixed; a footer deviation (the unchanged `UIFooter`) is
    recorded as a follow-up issue. The PR opens only with zero unresolved defects.
  - Ink widths are compared only for the runs with a Figma reference in appendix A.4; runs
    marked n/a there are covered by NFR-1 line boxes and the NFR-4 raster crop.
  - **en layout pass:** because every browser lane renders the build-time language (uk), the
    reviewer also runs `make start` with `REACT_APP_MAIN_LANGUAGE=en` in the local, untracked
    `.env` (dev server restarted, value restored afterwards, no source change) and records: the
    en 403 actions row on one line inside the card at 1024 x 1366; the en 403 and 5xx
    descriptions inside the text inset at 1024, 375 and 320; no horizontal scroll at 320. These
    are layout checks without a parity claim (no en frame exists).
  - At 375 the report confirms each glyph span and the card lie within x 0 to 375.
  - Visual baselines are regenerated after the last fix, only in the pinned Playwright
    container or from the CI artifact.
- **Test cases:**
  - P1: the report covers all five frames and every appendix A element.
  - N1: a seeded 2 px offset of the card is reported as a defect (reviewer calibration).
- **Verify:** Fable report attached to the PR.

#### FR-20: Pull request content

- **Acceptance:** the PR for #309 (`feat(#309): …`, squash header at most 100 characters)
  closes #309 and lists, as items for design or maintainer confirmation:
  - the 5xx copy (placeholder in the design);
  - "На жаль" instead of "Нажаль";
  - white on `#1EAEFF` (2.46:1) under the scoped exception, tracked in #276;
  - the decorative digits (404 2.37:1, 5xx 1.58:1 on `#FBFBFB`) under the second scoped
    exception, tracked in #276;
  - the outlined border `#969B9D` on white (2.81:1);
  - the centred tablet card;
  - the lost in-place retry for 5xx route responses;
  - the inert "Запросити доступ" TODO (RBAC #114);
  - the measured Lighthouse scores of `/forbidden` and `/server-error`, mobile included, read
    against the profile's 85 (NFR-12);
  - the en layout pass results (FR-19).
- **Verify:** PR review.

## 10. Non-Functional Requirements

### 10.1 Pixel fidelity (content area)

Measurement method: the reviewer opens each page in chromium at device scale factor 1 and the
frame width, waits for `document.fonts.status === 'loaded'` and a stable DOM, and reads element
boxes with `getBoundingClientRect()` relative to the composition origin O. Colours and type are
read from computed styles. The Figma reference is appendix A (tool values from F§1 to F§3).
Ink width is the width of a DOM `Range` over the text node (`range.selectNodeContents(el);
range.getBoundingClientRect().width`), compared with the Figma ink width of the text content,
never with a Figma fixed-width text box. Appendix A.4 lists the reference per run, with its
Figma node; a run without a reference (fixed-width box, placeholder or changed copy) is marked
n/a there and is covered by its NFR-1 line box and the NFR-4 raster crop instead.

| ID    | Property             | Desktop 1440 / tablet 1024                       | Mobile 375                  |
| ----- | -------------------- | ------------------------------------------------ | --------------------------- |
| NFR-1 | Box geometry vs O    | x, y, width, height within ±1 CSS px             | within ±1.5 CSS px          |
| NFR-2 | Text runs            | line-box height and top ±1 px; ink width ±2 px   | line box ±1.5 px; ink ±2 px |
| NFR-3 | Colour and type      | exact hex, opacity, shadow, family, weight, size | same                        |
| NFR-4 | Raster crop (Fable)  | ≤ 1.5 % mismatched pixels                        | ≤ 3 % mismatched pixels     |
| NFR-5 | Regression (CI gate) | 0 diff vs committed baseline, three engines      | same                        |

- **NFR-1 to NFR-3** apply to every element of appendix A: digit frame and each glyph box, card,
  card children (line boxes for text; the description is centred and carries no fixed width),
  tab, curve, diamond, dot, dot columns or rows, and the 76 / 43.61 px offsets.
- **NFR-4:** the Figma reference is exported with the Figma MCP `get_screenshot`, passing
  `maxDimension` equal to the frame's longer edge (1440 for 143:12154, 172:6675 and 172:6914;
  1366 for 143:12166; 1082 for 143:12178) and `enableBase64Response: true` (curl to
  `figma.com` is permission-blocked here). The run fails unless the returned `width` / `height`
  equal `original_width` / `original_height`. The content-area crop (the ink box of the
  composition's visible layers plus 16 px on each side, aligned on O, then intersected with the
  frame's 0 to frame-width x range) of that export and of the browser screenshot are compared
  with `pixelmatch`, `threshold: 0.1`, anti-aliased pixels excluded, after the per-frame masks
  below are painted out of both images. Text rasterisation differs between Figma and browsers,
  so NFR-4 is a review threshold that backs NFR-1 to NFR-3, not a CI gate.
- **NFR-4 masks** (the planned deviations, so the ratio measures only unplanned ones; the report
  lists each masked rectangle so the ratio can be reproduced):
  - 172:6914 (5xx): the title and description line boxes across the full card width (relative
    to O: y 359 to 402 and 408 to 434, x 0 to 614), because the frame holds placeholder copy.
  - 172:6675 (403): the description line box across the full card width (y 408 to 434), for
    "На жаль"; the Figma diamond and dot boxes (relative to O: x −81 to −41, y −9 to 31, and
    x 444 to 455.842, y 31 to 42.856) and the rendered diamond and dot boxes (x 44 to 84,
    y 54 to 94, and x 569 to 580.842, y 94 to 105.856). Every dot box is the rotated node's
    `absoluteBoundingBox`, never its `x` / `y`. Alternatively the 403 decoration
    layer is compared against the 404 frame 143:12154, whose geometry is identical.
  - 143:12178 (mobile): no mask; the crop is clipped to x 0 to 375 of the frame, and the
    off-canvas dot and vertical columns are not visible layers, so they never enter the ink box.
- **NFR-5:** `toHaveScreenshot` with the repository defaults (no `maxDiffPixels` override),
  matching the profile's `quality.visual_diffs: 0`.

> Assumption: ±1 CSS px is the tolerance the brief set for "pixel-perfect" (B§6); ±1.5 px on
> mobile absorbs the fractional 0.7391 / 0.6318 scales, and the raster ratios were set as review
> thresholds because no Figma-vs-browser raster baseline exists in the repository.

### 10.2 Visual stability

- **NFR-6:** the pages render deterministically for the visual lane: no animation, no
  time-dependent content, no network images; the lazy chunk settles before `wait-for-stable-dom`
  resolves. PR runs use `retries: 0` and the nightly flake budget stays 0.

### 10.3 Accessibility

- **NFR-7:** WCAG 2.1 AA (`WCAG_AA_TAGS`) per FR-11, including:
  - 1.4.4: text sizes in `rem`; resize is covered by the 320 px reflow checks (FR-14 E1, E2,
    E4), the equivalent of a 1280 px window at 400 %;
  - 1.4.10: reflow at 320 CSS px (FR-14 E1, E2, E4);
  - 1.4.12: `tests/e2e/a11y/error-pages-text-spacing.a11y.spec.ts` injects the 1.4.12 override
    stylesheet (line height 1.5, letter spacing 0.12em, word spacing 0.16em, paragraph spacing
    2em, all `!important`) on `/forbidden` at 1440, 1024 and 375 (uk) and asserts that the
    `h1`, the description and both actions lie inside the card's box (no clipping by its
    `overflow: hidden`); the actions row may wrap;
  - 2.4.7 and 2.5.3 per FR-11.
- The status digits fail 1.4.3 for large text (404 `#1EAEFF` 2.37:1 and 5xx `#FFC01E` 1.58:1 on
  `#FBFBFB`, under 3:1). They are DOM text inside an `aria-hidden` box and are covered by the
  second NFR-8 exception; they are not taken out of the scan by CSS generated content. The code
  they show is also given in text by the visually hidden `error_page.<variant>.code` line
  (FR-11), so WCAG 1.3.1 holds although the glyph spans are hidden from assistive technology.
- **NFR-8:** exactly two new scoped `A11Y_EXCEPTIONS` entries, each with rule
  `color-contrast`, a stable non-wildcard selector, a reason and the #276 tracking URL:
  (1) the white-on-`#1EAEFF` primary labels (2.46:1), selector
  `#error-page-actions > .MuiButton-contained`; (2) the decorative status digits (2.37:1 and
  1.58:1), selector `#error-page-digits > span`. Both are listed in the acceptance standard's
  "Current exceptions". No other exception is added or widened; the back-to-main exception must
  not match any error-page element.
- **NFR-9:** 0 axe violations outside NFR-8 in the jest-axe lane (three variants) and the route
  lane (three routes, three engines).

> Assumption: the primary buttons keep the design's white on `#1EAEFF` under the NFR-8 entry,
> following the auth submit-button precedent, and the deviation is flagged in the PR.

### 10.4 Performance

- **NFR-10:** the eager graph stays MUI-free apart from the existing
  `app-providers.tsx -> @mui/material/styles` edge (`performance-serving.test.ts`); the Rspack
  raw hint passes with `raw.maxInitialEntrypointBytes` unchanged at 470,000 B; no value in
  `config/performance-budget.json` changes.
- **NFR-11:** the eager gzip delta in the CI `bundle-size` comment is at most 2,048 B; each new
  chunk (`error-page`, `forbidden`, `server-error`, reworked `not-found`) stays under 130,000 B
  gzip and 400,000 B raw; the decoration assets total at most 20 kB raw (the curve rebuilt as
  one stroked path, about 7 kB, R§8.4).
- **NFR-12 (Lighthouse):** `/forbidden` and `/server-error` join the audited URLs and pass the
  existing `lighthouserc` assertions: desktop performance, accessibility and best practices
  0.95 and SEO 0.90 (`lighthouse/lighthouserc.desktop.js`); mobile performance 0.84
  (`median-run`) and accessibility, best practices and SEO 0.90
  (`lighthouse/lighthouserc.mobile.js`); plus the resource-summary budgets. A green
  `performance testing / lighthouse desktop|mobile` job proves exactly those assertions. The
  profile's stricter `quality.lighthouse_mobile` 85 binds the two error routes only, and is
  checked by reading their mobile category scores in the LHCI report and recording them in the
  PR body. The three existing URLs are not re-scored by this requirement (nothing in #309
  changes them); the change adds no request to them. If an error route cannot meet a floor,
  that is raised to the product owner as an explicit question in the PR, never solved by a budget, floor or
  URL-list change.
- **NFR-13 (runtime):** the `RouteFallback` 150 ms deferred paint covers the lazy page, so a
  fast chunk load shows no spinner; the memlab scenarios that use the 404 page as their away
  page report no leak.

> Assumption: the 2,048 B eager allowance (B§6, M-11) is a review threshold for this change, not
> a budget entry. It covers the status detector, the lazy loader, the new catalog strings in the
> eager `localization.json` and the async chunk map.

### 10.5 Code quality floors (raise-only)

The profile's `quality.*` values are floors and ceilings that this change may tighten and never
relax. No `gate-relaxation` label is applied.

| ID     | Gate                                  | Required value                                            |
| ------ | ------------------------------------- | --------------------------------------------------------- |
| NFR-14 | i18n parity (`make lint-i18n`)        | pass; en/uk key parity, one owner per key, no empty value |
| NFR-15 | Coverage (Jest)                       | statements, branches, functions, lines: 100 %             |
| NFR-16 | Mutation (Stryker `break`)            | 100, 0 survivors; every new `src` file directly tested    |
| NFR-17 | ESLint / `tsc` / dependency-cruiser   | 0 errors, 0 warnings, 0 diagnostics, 0 violations         |
| NFR-18 | jscpd / rust-code-analysis / markdown | 0 clones (`minTokens` 70); 0 metric failures; 0 findings  |

- **NFR-16 detail:** module-scope literals (style tokens, the configuration table, the status
  range) are loaded inside the test (`tests/unit/utils/isolated-module.ts`). Equivalent-mutant
  annotations are a last resort with a written proof, preferring simpler code.
- **NFR-17 detail:** class-only `.ts` with approved suffixes (`config/class-naming-policy.js`),
  types only in type-only files under `src/components/types/`, no `data-testid`, no
  `new PascalCase()` in `.tsx`, no disable or ignore directive of any kind.
- **NFR-18 detail:** one component per file; the status branch outside `RouteError`'s own
  function body; art imported as assets, never as large inline JSX.

### 10.6 Console gate

- **NFR-19 (unit):** every Jest setup keeps `installConsoleGate()`; the allowlist stays empty. Tests
  await the lazy page (`findBy…`), and a test that throws through a route passes and asserts
  `onCaughtError`. No file-wide console spy.
- **NFR-19 (E2E):** every E2E spec uses the console fixture; the pages emit no `console.error`,
  `console.warn` or `pageerror`, including on the inert button. The app has no language
  switcher UI, so language-switch output is covered by the unit card test, which calls
  `i18n.changeLanguage('en')` under the console gate.

### 10.7 Security and delivery

- **NFR-20:** all assets are committed and same-origin; no `figma.com/api/mcp/asset` URL, no
  remote font, no inline script, no new runtime dependency (no ADR-drift trigger from
  `package.json`).
- **NFR-21 (CI):** green on the PR head: `static testing / static`, `unit testing / unit`,
  `integration testing / integration`, `mutation testing` (merge and enforce gate),
  `e2e testing / test`, `visual tests / test`, `accessibility testing / a11y-unit`,
  `accessibility testing / a11y-e2e`, `bundle size / measure and gate`,
  `performance testing` (Lighthouse desktop and mobile), `memory leak` and `gate ratchet`.
- **NFR-22 (process):** no heavy suite runs locally; local verification is focused Jest,
  ESLint, Prettier, `tsc`, `make lint-i18n`, `make check-e2e-route-coverage` and the cheap
  Docker linters. Visual baselines never come from a reused prod container.

> Assumption: the CI check names in NFR-21 are the workflow names CLAUDE.md uses; the
> architecture stage re-verifies the exact `<workflow> / <job>` strings against
> `.github/workflows/`.

## 11. Traceability Matrix

| Brief item | Requirement                                | FRs / NFRs                            |
| ---------- | ------------------------------------------ | ------------------------------------- |
| G-1        | 404 page at 1440 / 1024 / 375              | FR-2, FR-12, FR-13, FR-14             |
| G-2        | 403 page on `/forbidden`                   | FR-3, FR-5, FR-7, FR-8                |
| G-3        | 5xx page on `/server-error`                | FR-4, FR-5, FR-7                      |
| G-4        | Status-aware `RouteError`                  | FR-6                                  |
| G-5        | Pixel parity                               | FR-12 to FR-15, FR-19, NFR-1 to NFR-6 |
| G-6        | Accessible by construction                 | FR-11, NFR-7 to NFR-9                 |
| G-7        | Bilingual                                  | FR-9, FR-10, NFR-14                   |
| G-8        | Covered                                    | FR-17, NFR-15, NFR-16                 |
| M-1        | One focused `h1` per route, uk and en      | FR-9, FR-11                           |
| M-2        | `RouteError` matrix 9 of 9                 | FR-6                                  |
| M-3        | Home `href="/"`, inert request access      | FR-7, FR-8                            |
| M-4        | Fable: zero unresolved defects             | FR-19, NFR-1 to NFR-4                 |
| M-5        | Visual baselines, three engines            | FR-17, NFR-5                          |
| M-6        | Coverage 100, mutation 100                 | NFR-15, NFR-16                        |
| M-7        | Static gates 0, no relaxation              | NFR-17, NFR-18                        |
| M-8        | `lint-i18n`, route coverage                | FR-17, NFR-14                         |
| M-9        | Axe clean apart from two scoped exceptions | NFR-8, NFR-9                          |
| M-10       | One eager MUI edge, raw budget unchanged   | NFR-10                                |
| M-11       | Eager gzip delta ≤ 2,048 B                 | NFR-11                                |

## 12. Risks

Carried from B§9; each has an owning requirement.

| ID  | Risk                                                | Mitigation (requirement)                           |
| --- | --------------------------------------------------- | -------------------------------------------------- |
| R1  | Page or MUI pulled into the eager chunk             | Lazy themed loader (FR-6); NFR-10, NFR-11          |
| R2  | White on primary fails the route axe lane           | One scoped exception (NFR-8); flagged (FR-20)      |
| R3  | 5xx loses the in-place **Try again**                | ADR update (FR-18); flagged (FR-20)                |
| R4  | Pre-outlined curve ships about 200 kB of SVG        | Stroked-path rebuild, 20 kB cap (NFR-11)           |
| R5  | Page rendered without the CRM theme                 | `ThemedChunkLoader` (FR-6)                         |
| R6  | Baselines regenerated from stale code               | Pinned container or CI artifact (FR-19, NFR-22)    |
| R7  | Fable flags intended deviations                     | Assumptions handed to the reviewer (FR-19)         |
| R8  | Status branch unreachable from render-only routes   | Detector reads thrown `Response` / `data()` (FR-6) |
| R9  | memlab away page is the 404 page                    | Leak-free page (NFR-13)                            |
| R10 | Back-to-main exception over-matches a new home link | Selector check (NFR-8)                             |
| R11 | Outlined button without a focus style               | Focus outline (FR-11)                              |
| R12 | Duplicate footer inside `AppLayout`                 | Region mode renders no footer (FR-16)              |
| R13 | Error-page chunk fails to load inside `RouteError`  | Fallback to `ErrorFallback` (FR-6)                 |

## 13. Open Questions, Follow-ups and TODOs

- **TODO (not in code):** wire "Запросити доступ" to an access-request flow once one exists
  (RBAC #114). Recorded here and in the PR body (FR-20).
- **Design confirmation (flagged in the PR):** the 5xx copy, "На жаль", white-on-primary
  contrast, the decorative digit contrast, the `#969B9D` outlined border, the centred tablet
  card, the 24 / 16 px text inset, and the missing hover, focus and pressed designs.
- **Follow-ups (new issues, not this PR):** the app shell; the 636 px 403 and 5xx tablet card
  (frames 172:6702, 172:6941); any footer deviation the Fable review finds.

> Assumption: the PR closes #309; the shell and the access-request flow are separate issues.

## 14. Next Step

The architecture is complete in
[`architecture-309-error-pages-2026-10-01.md`](./architecture-309-error-pages-2026-10-01.md) and
recorded as ADR-018. Implement and deliver against it, closing the requirements and acceptance
criteria in section 9 and the NFRs in section 10.

## Appendix A: Parity reference

All values are px, relative to the composition origin O (x at the card's left edge, y at the
digit frame's top). Positions and sizes of rotated nodes (the dot, the mobile dot rows) are their
Figma `absoluteBoundingBox` (the axis-aligned box), never the node's `x` / `y`, which is the
rotated node's transform origin; plan iteration 3 re-read both from Figma on 2026-10-01. Source:
F§1 to F§3.

### A.1 Desktop (1440; 404, 403, 5xx)

| Layer         | x       | y       | w      | h       | Style                                                       |
| ------------- | ------- | ------- | ------ | ------- | ----------------------------------------------------------- |
| Digit frame   | 74      | 0       | 466    | 330     | glyph x 0 / 147 / 301, y 0 / 36 / 0                         |
| Card          | 0       | 330     | 614    | 222     | see FR-12                                                   |
| Title         | centred | 359     | -      | 43      | 404 text box 236 wide, 403 384 wide                         |
| Description   | centred | 408     | -      | 26      | -                                                           |
| Actions       | centred | 458     | 165    | 62      | 403 row 401 wide (165 + 8 + 228)                            |
| Yellow tab    | 37      | 301     | 540    | 225     | `#FFC01E`, radii 32 32 0 0, right 37                        |
| Dashed curve  | -56     | 36      | 643    | 357     | `#00A3FF`, opacity 0.3, stroke 1.5                          |
| Diamond       | 44      | 54      | 40     | 40      | `#01A6FF` outline square at 45°                             |
| Dot (bbox)    | 569     | 94      | 11.842 | 11.856  | `#0B315E`, circle 10.338 x 10.354, centre (574.921, 99.928) |
| Dot column 10 | -27.654 | 376     | 6.745  | 161.541 | `#E1E7EA`, dots Ø 6.72, pitch about 17.2                    |
| Dot column 8  | -44.480 | 393.210 | 6.745  | 127.121 | centred on y 456.77                                         |
| Dot column 6  | -63     | 410.397 | 6.722  | 92.748  | -                                                           |
| Dot column 4  | -80     | 427.607 | 6.722  | 58.351  | -                                                           |

### A.2 Tablet (1024; 404)

| Layer         | x       | y       | w       | h       | Style                                            |
| ------------- | ------- | ------- | ------- | ------- | ------------------------------------------------ |
| Digit frame   | 4       | 0       | 466     | 330     | glyphs as desktop                                |
| Card          | 0       | 330     | 474     | 235     | see FR-13                                        |
| Title         | centred | 354     | -       | 43      | ink 236 (A.4)                                    |
| Description   | centred | 401     | -       | 30      | 18 / 30                                          |
| Button        | centred | 455     | 189     | 70      | padding 20 / 44                                  |
| Yellow tab    | 26      | 301     | 421     | 225     | radii 32 32 0 0, right inset 27                  |
| Dashed curve  | -84.303 | 36      | 654.860 | 357     | desktop path, x scaled by 1.018446               |
| Diamond       | 17.541  | 54      | 40.738  | 40      | x-stretched 1.0185                               |
| Dot (bbox)    | 552.225 | 94      | 12.060  | 11.856  | circle 10.529 x 10.354, centre (558.255, 99.928) |
| Dot column 10 | -25.899 | 376     | 6.869   | 161.541 | -                                                |
| Dot column 8  | -43.036 | 393.210 | 6.869   | 127.121 | -                                                |
| Dot column 6  | -61.897 | 410.397 | 6.846   | 92.748  | -                                                |
| Dot column 4  | -79.211 | 427.607 | 6.846   | 58.351  | -                                                |

### A.3 Mobile (375; 404)

| Layer        | x       | y       | w       | h       | Style                                       |
| ------------ | ------- | ------- | ------- | ------- | ------------------------------------------- |
| Digit frame  | 2.956   | 0       | 344.435 | 243.913 | glyph x 27.739 / 120.606 / 217.896          |
| Glyph tops   | -       | 14.582  | 97      | 186     | outer glyphs; middle 37.324, 101 x 186      |
| Card         | 0       | 243.912 | 350.348 | 173.696 | see FR-14                                   |
| Title        | centred | 270.388 | -       | 26      | Golos 700 22, ink 144 (A.4)                 |
| Description  | centred | 300.128 | -       | 25      | 15 / 25                                     |
| Button       | centred | 341.128 | 132     | 50      | padding 16 / 24                             |
| Yellow tab   | 19.216  | 222.478 | 311.174 | 166.304 | radii 23.652 23.652 0 0; right inset 19.958 |
| Dashed curve | 2.695   | 58.388  | 360     | 200     | desktop path scaled 0.559876 x 0.560224     |
| Diamond      | 10.346  | 39.912  | 29.565  | 29.565  | -                                           |
| Dot row 10   | 94.695  | 437.387 | 161.541 | 6.745   | horizontal, dots Ø 6.72 (unscaled)          |
| Dot row 8    | 111.905 | 454.213 | 127.121 | 6.745   | -                                           |
| Dot row 6    | 129.091 | 472.756 | 92.748  | 6.722   | -                                           |
| Dot row 4    | 146.301 | 489.756 | 58.351  | 6.722   | -                                           |

The mobile dot and the four vertical dot columns are drawn off-canvas in the frame and are not
rendered. The glyph tops are relative to the digit frame's top (O's y).

Description widths are deliberately `-`: Figma draws the 404 descriptions as fixed-width text
boxes (354 px on the desktop 404 and the tablet frame, 261.652 px on mobile), wider than their
short text runs, while the page centres a `p` that shrinks to its text (capped by the 24 / 16 px
text inset). Those box widths are not rendered geometry; the description is checked by its line
box (NFR-1), by its ink width where A.4 gives a reference, and by the NFR-4 raster crop.

### A.4 Ink-width references (NFR-2)

Figma hug widths (`WIDTH_AND_HEIGHT` text boxes) are the ink reference; a fixed-width box is not
one. Re-read with `get_metadata` on 2026-10-01.

| Run                     | Frame     | Figma node | Reference | NFR-2 ink check                                     |
| ----------------------- | --------- | ---------- | --------- | --------------------------------------------------- |
| 404 title, desktop      | 143:12154 | 143:12586  | 236       | yes, ±2 px                                          |
| 404 title, tablet       | 143:12166 | 143:12601  | 236       | yes, ±2 px                                          |
| 404 title, mobile       | 143:12178 | 143:12630  | 144       | yes, ±2 px                                          |
| 403 title, desktop      | 172:6675  | 172:6685   | 384       | yes, ±2 px                                          |
| 404 description, desk.  | 143:12154 | 143:12587  | n/a       | no: 354 px fixed box; NFR-1 line box and NFR-4 crop |
| 404 description, tablet | 143:12166 | 143:12602  | n/a       | no: 354 px fixed box; NFR-1 line box and NFR-4 crop |
| 404 description, mobile | 143:12178 | 143:12631  | n/a       | no: 261.652 px fixed box; NFR-1 and NFR-4           |
| 403 description         | 172:6675  | 172:6686   | 399       | no: copy changed ("На жаль" adds a space); masked   |
| 5xx title, description  | 172:6914  | -          | n/a       | no: placeholder copy replaced; masked under NFR-4   |
| Button labels           | all       | -          | n/a       | no: covered by the button boxes under NFR-1         |
