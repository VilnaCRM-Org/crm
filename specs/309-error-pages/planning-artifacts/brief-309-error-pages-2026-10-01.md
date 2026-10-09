---
status: 'complete'
workflowType: 'product-brief'
stepsCompleted: [1, 2, 3, 4, 5, 6]
project_name: 'crm'
date: '2026-10-01'
issue: 309
branch: 'feat/309-error-pages'
author: 'analyst (Mary), autonomous run'
inputDocuments:
  - 'https://github.com/VilnaCRM-Org/crm/issues/309'
  - 'specs/309-error-pages/planning-artifacts/research-309-error-pages-2026-10-01.md'
  - 'Figma file xZ7ccrH6d4QyqLQsayFSEX, nodes 143:12154, 143:12166, 143:12178, 172:6675, 172:6914'
  - 'CLAUDE.md'
  - '.claude/react-sdlc.yml'
---

# Product Brief: 404 / 403 / 5xx error pages from Figma (#309)

Predecessor: [technical research](./research-309-error-pages-2026-10-01.md). Every figure below
is taken from that artifact (section numbers in brackets, "R§n") unless it is marked as a new
target. Figma numbers are tool values unless marked **ESTIMATED** there.

## 1. Executive Summary

When a CRM user follows a dead link, opens a page they may not see, or hits a failing server,
the app today shows either a generic, unstyled "page not found" block or the developer-facing
`ErrorFallback` recovery screen. Neither matches the VilnaCRM design, there is no "access
denied" page at all, and the RBAC work (#114) has nowhere to send a user it refuses.

Issue #309 implements the three error pages drawn in Figma: **404** (desktop, tablet, mobile),
**403** and **5xx** (desktop). All five frames share one composition: large status digits, a
decorative illustration, a yellow tab and a white card with a heading, a description and one or
two actions (R§4.1). The brief therefore defines one shared, presentational error page fed three
configurations, wired in three places:

- the catch-all route renders the 404 page;
- `RouteError` renders the matching page when a route error response carries 403, 404 or a 5xx
  status, and keeps today's `ErrorFallback` behaviour for everything else;
- two new public routes, `/forbidden` and `/server-error`, render the 403 and 5xx pages
  directly.

The content area and the existing footer are reproduced pixel-perfect; the app header and left
sidebar drawn in the frames are out of scope. A Fable-model reviewer verifies parity against the
frames before the PR for #309 is opened.

## 2. Core Vision

### Problem Statement

- **The 404 page does not match the design.** `src/components/not-found/` renders
  `UIBackToMain` (an `h4`-styled heading, a description and a text button) over the footer, with
  copy "Сторінку не знайдено" that differs from the design's "Помилка 404" (R§3.1).
- **There is no 403 page.** A forbidden route response falls through to `ErrorFallback`'s
  generic "This page is not available" message (R§3.3).
- **There is no designed 5xx page.** A 5xx route response shows `ErrorFallback` with
  **Try again** (R§3.3), a recovery screen, not the designed page.
- **`RouteError` is status-blind.** It classifies every route error through
  `recoveryStrategyDetector` and never branches on the HTTP status (R§3.2).
- **No redirect target exists.** The RBAC layer (#114) needs a stable URL to send a denied user
  to, and a server-error URL for the same reason.

### Problem Impact

- Users who hit an error get a screen that looks unfinished and inconsistent with the rest of
  the product, in the main language (uk) and the fallback (en).
- A denied user cannot tell "this page does not exist" from "you are not allowed here".
- E2E, visual, a11y and Lighthouse lanes cannot reach a 403 or 5xx page, so those states have
  no browser coverage (the route-coverage inventory, R§7).

### Why Existing Solutions Fall Short

- **Restyling `ErrorFallback`.** It is the eager, MUI-free recovery screen for crashes of any
  kind, including the bootstrap path in `src/index.tsx` (R§3.2, R§3.4). Loading the design's
  illustration and MUI buttons into it would grow the eager entrypoint and break the
  "one eager `@mui/*` edge" pin (R§8.1).
- **Three separate page components.** jscpd runs at threshold 0 (`minTokens` 70, R§10); three
  copies of one composition would fail it.
- **ui-toolkit `ui-error-boundary` / `ui-footer` / `ui-button`.** Deliberately not adopted by
  ADR-016 (R§5); this issue does not reopen that.

### Proposed Solution

1. One presentational `ErrorPage` in `src/components/error-page/`, driven by a per-status
   configuration (digits, digit colour and shadow, title key, body key, action set), with
   committed, optimised SVG decoration and styles in an `ErrorPageStyles` singleton (R§12).
2. Three thin entries: the reworked 404 page in place (keeping the pinned `not-found` chunk name
   and import path) and new `forbidden` and `server-error` pages in the existing `app.shell`
   route contract, under new `ROUTE_PATHS` keys `forbidden` and `serverError`.
3. A small, MUI-free status detector in `RouteError`: 403, 404 and 500–599 route responses
   render the lazy, themed status page (with the `landmark` forwarded); every other error keeps
   `ErrorFallback`.
4. The existing `UIFooter` below the composition, a `#FBFBFB` page background, a focused `<h1>`,
   `aria-hidden` digits and art, with the status code also given once as visually hidden text
   (architecture §8.4, plan iteration 3).

### Key Differentiators

- **One implementation, three configurations.** Matches how the design is built and what jscpd
  demands.
- **Zero eager MUI.** The page reaches `RouteError` only through a lazy loader modelled on
  `footer-loader.ts` (`ThemedChunkLoader` over `ChunkRetryLoader`), so the eager graph keeps its
  single MUI edge (R§8.1).
- **A real redirect target for RBAC.** `/forbidden` and `/server-error` are stable, public,
  browser-tested URLs.

## 3. Goals

- **G-1 404 page:** the catch-all route renders the designed 404 page at 1440, 1024 and 375
  widths, replacing the `UIBackToMain` layout.
- **G-2 403 page:** `/forbidden` renders the designed 403 page with an outlined "На головну" and
  a primary "Запросити доступ" button.
- **G-3 5xx page:** `/server-error` renders the designed 5xx page with the binding copy and one
  "На головну" button.
- **G-4 Status-aware `RouteError`:** route error responses with status 403, 404 or 500–599 render
  the matching page; all other errors render `ErrorFallback` unchanged.
- **G-5 Pixel parity:** the content area of every frame is reproduced against the
  composition-relative numbers in R§4, verified by the Fable review and locked by visual
  baselines.
- **G-6 Accessible by construction:** WCAG 2.1 AA per the acceptance standard — one focused
  `h1`, decorative art hidden from assistive technology, keyboard-operable actions, and contrast
  handled as in section 8.
- **G-7 Bilingual:** uk and en copy for every string, locale parity gate green.
- **G-8 Covered:** unit, E2E, visual and a11y coverage for every variant; the route-coverage
  manifest lists both new routes.

## 4. Non-Goals

- **The app shell drawn in the frames.** The header (search, notifications, user menu) and the
  left sidebar are out of scope; no such shell exists and it is a separate issue. Pixel
  comparison is made against the content area only.
- **An access-request flow.** "Запросити доступ" is rendered exactly as designed but does
  nothing: no handler, no navigation, no request. Wiring it is a TODO tracked in these specs and
  the PR (section 10), never as an inline code comment.
- **Tablet and mobile 403 / 5xx frames.** None exist. The shared composition makes those pages
  responsive through the 404 tablet and mobile rules, but no parity claim is made for them.
- **Hover, focus and pressed designs.** No frames exist; the plan uses the `hover` token and a
  visible `:focus-visible` outline (R§11).
- **Changes to `ErrorFallback`, `UIErrorBoundary` or the bootstrap path.** They keep handling
  every non-status error.
- **Lighthouse audits of the catch-all.** `notFound` (`'*'`) has no stable URL and stays out of
  `lighthouse/constants.js`; `/forbidden` and `/server-error` are added to it (superseded in
  the PRD, NFR-12, by the product owner's "reachable by E2E/visual/Lighthouse" decision and
  `docs/accessibility/acceptance-standard.md`, which asks it of user-facing routes).
- **Fixing the design's palette contrast.** The white-on-`#1EAEFF` issue is tracked in #276.

## 5. Users and Stakeholders

### Primary users

- **CRM end users (uk first, en fallback).** They land on an error page from a stale bookmark, a
  mistyped URL, a denied route or a server failure. Success: they understand what happened in
  one glance and get back home in one action.
- **Keyboard and screen-reader users.** Success: focus lands on the `h1`, the page announces one
  heading and a description, the digits and art are silent, and every action is reachable and
  visibly focused.

### Secondary users and stakeholders

- **RBAC developers (#114).** Consumers of `/forbidden` (and `/server-error`) as redirect
  targets and of the status-aware `RouteError` when a guard throws a 403 response.
- **Design.** Confirms the deviations flagged in the PR: the 5xx copy, the "На жаль"
  orthography, button contrast, the outlined border contrast, the centred tablet card.
- **QA and the Fable reviewer.** Need the routes reachable and the centring assumption stated so
  an intended deviation is not reported as a defect.
- **The maintainer, [@kravalg](https://github.com/kravalg).** Decider on any ADR amendment for
  the 5xx behaviour change and reviewer of the a11y exception.

### User journeys

1. **Unknown URL:** the user opens `/does-not-exist` → the 404 page renders inside the public
   layout → "На головну" returns to `/`.
2. **Denied page:** a guard redirects to `/forbidden`, or throws a 403 response caught by
   `RouteError` → the 403 page renders → "На головну" returns home; "Запросити доступ" is
   visible and inert.
3. **Server failure:** a route throws a 5xx response, or the app redirects to `/server-error` →
   the 5xx page renders → "На головну" returns home.
4. **Any other crash:** `ErrorFallback` renders exactly as today.

## 6. Success Metrics

All metrics are binary or numeric and are read from CI, a committed file or the Fable review.

### Behaviour

- **M-1** An unknown path, `/forbidden` and `/server-error` each render exactly one `h1` with
  the variant's title in uk (and in en when the language is switched), and focus is on that `h1`
  on arrival.
- **M-2** A `RouteError` unit matrix over statuses 400, 401, 403, 404, 499, 500, 599, 600 and a
  non-response error renders the 403 page for 403, the 404 page for 404, the 5xx page for
  500–599, and `ErrorFallback` for every other case (9 of 9).
- **M-3** Every home action is a link with `href="/"`; activating "Запросити доступ" leaves the
  URL, the DOM and the network log unchanged (E2E).

### Pixel parity

- **M-4** The Fable review reports zero unresolved defects for the content area of all five
  frames: digits, card, tab, decoration and footer, measured against the composition-relative
  numbers in R§4 at 1440, 1024 and 375 widths.
- **M-5** Visual baselines exist for the 404 page at 1440, 1024 and 375 and for the 403 and 5xx
  pages at 1440, in chromium, firefox and webkit, generated only in the pinned Playwright
  container or taken from the CI artifact; the six existing not-found baselines are regenerated
  the same way.

> Assumption: "pixel-perfect" means element boxes within ±1 CSS px of the composition-relative
> figures and exact colours, font families, weights and sizes. Sub-pixel Figma values (for
> example the mobile 0.7391 scale) are rounded by the browser and are not defects. The tablet
> card is centred (R§4.6), not offset for the out-of-scope sidebar.

### Quality floors (unchanged, raise-only)

- **M-6** Jest coverage stays 100/100/100/100; Stryker `break` stays 100 with 0 survivors; every
  new `src` file has a direct test.
- **M-7** ESLint, `tsc`, dependency-cruiser, jscpd and rust-code-analysis report 0 findings;
  `gate ratchet` reports 0 relaxations and no `gate-relaxation` label is applied.
- **M-8** `make lint-i18n` and `make check-e2e-route-coverage` pass, with e2e, visual and a11y
  rows for `forbidden` and `serverError`.

### Accessibility

- **M-9** jest-axe covers the three variants and the Playwright route lane scans `/forbidden` and
  `/server-error` in chromium, firefox and webkit with 0 violations outside two new scoped
  `A11Y_EXCEPTIONS` entries: the white-on-primary button labels (section 8) and the decorative
  status digits (2.37:1 and 1.58:1 on `#FBFBFB`; superseded detail in architecture §8.4).

### Bundle

- **M-10** `performance-serving.test.ts` still finds exactly one eager `@mui/*` edge
  (`app-providers.tsx`), the Rspack raw hint passes with `raw.maxInitialEntrypointBytes`
  unchanged at 470,000 B, and `config/performance-budget.json` is not edited.
- **M-11** The eager gzip delta in the CI `bundle-size` comment is at most 2,048 B, and the new
  error-page chunk stays under the 130,000 B per-asset gzip budget.

> Assumption: M-11's 2,048 B eager allowance is a review threshold for this change only, not a
> budget entry. It covers the status detector, the lazy loader, the added catalog strings in
> the eager `localization.json` and the async chunk map; the illustration, styles and page
> components must all land in lazy chunks.

### Definition of done

M-1 to M-11 hold on the PR, the PR flags the design deviations (section 10), and the
"Запросити доступ" TODO is recorded in the PR body and in these specs.

## 7. Scope

### In scope

- `src/components/error-page/`: the shared page, its per-status configuration, styles singleton,
  i18n catalog and committed SVG assets (curve rebuilt as one stroked path, R§8.4).
- The reworked `not-found` page (same chunk name and import path), the new `forbidden` and
  `server-error` pages, and their `app.shell` route entries and `ROUTE_PATHS` keys.
- The status detector and lazy, themed loader used by `RouteError`.
- Copy in uk and en, the regenerated `src/i18n/localization.json`, and keeping
  `route_fallback.loading` owned somewhere.
- Tests: unit (including the rewritten `route-error.test.tsx` cases and the reworked
  `not-found.test.tsx`), jest-axe, E2E, Playwright a11y routes, visual specs and baselines, the
  route-coverage manifest, tooling pins for the new chunk names.
- Docs: `src/routes/README.md`, the pattern-14 text in `CLAUDE.md`, `AGENTS.md` and the Copilot
  instructions, `docs/accessibility/acceptance-standard.md` for the new exception, and an ADR-007
  amendment (or a new ADR) for the 5xx behaviour change, with
  `Deciders: [@kravalg](https://github.com/kravalg)`.

### Binding copy

| Variant | Lang | Title                | Body                                                           | Actions                                 |
| ------- | ---- | -------------------- | -------------------------------------------------------------- | --------------------------------------- |
| 404     | uk   | Помилка 404          | Сторінки не існує                                              | На головну                              |
| 404     | en   | Error 404            | This page does not exist                                       | Go to homepage                          |
| 403     | uk   | В доступі відмовлено | На жаль, у вас немає прав доступу до цієї сторінки             | На головну (outlined), Запросити доступ |
| 403     | en   | Access denied        | Unfortunately, you do not have permission to access this page  | Go to homepage, Request access          |
| 5xx     | uk   | Помилка сервера      | Сервер тимчасово недоступний. Спробуйте пізніше.               | На головну                              |
| 5xx     | en   | Server error         | The server is temporarily unavailable. Please try again later. | Go to homepage                          |

The digits are `404`, `403` and `5xx` exactly as designed.

> Assumption: the uk 403 body uses the correct orthography "На жаль" instead of the design's
> "Нажаль"; the deviation is flagged for design in the PR (R§1).
>
> Assumption: the en home label reuses the existing en wording "Go to homepage" (the value of
> `not_found.cta` and `error_boundary.go_home`); only the value is reused, not the key (R§1).
>
> Assumption: the en 404 and 403 strings are the research candidates (R§11); the PRD may refine
> the wording without changing the uk copy.

## 8. Constraints

- **Product owner decisions (binding):** the wiring in section 1, the inert "Запросити доступ",
  the 5xx copy, the content-area-plus-footer scope, and Fable verification before the PR.
- **Root cause, never suppression:** no `eslint-disable`, ignore entry, lowered threshold, or
  widened allowlist; quality floors in `.claude/react-sdlc.yml` `quality.*` are raise-only.
- **Eager path:** `RouteError` is eager; the page, its MUI components, `UIFooter` and the art
  reach it only through a lazy loader under `<Suspense fallback={<RouteFallback />}>` (R§8.1).
- **Theme:** a page rendered by `RouteError` sits outside any page `ThemeProvider` (ADR-017), so
  the loader wraps it in `ThemedChunkLoader` (R§8.6).
- **Code shape:** classes only in non-React `src/**/*.ts`, approved class-name suffixes
  (`ErrorPageStyles`, `ErrorPageStatusDetector`, `ErrorPageLoader`), types in type-only files
  under `src/components/types/error-page/`, no `new PascalCase()` in `.tsx`, no `data-testid`,
  one component per file for rust-code-analysis, no added code comments (R§6).
- **Assets:** committed under the repo (CSP `img-src 'self' data:`); Figma MCP asset URLs expire
  on 2026-10-08 and are off-origin (R§8.4).
- **Fonts:** Golos 400 / 500 / 600 / 700 are already served same-origin; the page pins Golos
  explicitly (R§8.5).
- **Contrast:** white on `#1EAEFF` is 2.46:1 and fails WCAG 1.4.3 at 18 px / 600 (R§8.2).

  > Assumption: the primary buttons keep the design's white on `#1EAEFF` under one scoped
  > `A11Y_EXCEPTIONS` entry tracked by #276, following the auth submit-button precedent, and the
  > deviation is flagged in the PR (R§8.2).

- **Process:** no heavy local suites; bundle, visual, E2E, a11y-e2e and mutation evidence comes
  from CI. Visual baselines never come from a reused prod container.

## 9. Risks

| ID  | Risk                                                 | Mitigation                                          |
| --- | ---------------------------------------------------- | --------------------------------------------------- |
| R1  | Page or MUI pulled into the eager chunk              | Lazy loader; M-10 pin and M-11 allowance            |
| R2  | White-on-primary fails the route axe lane            | One scoped exception (#276); flagged in the PR      |
| R3  | 5xx loses the in-place **Try again** (ADR-007 / 009) | ADR amendment; flagged in the PR                    |
| R4  | Pre-outlined curve ships about 200 kB of SVG         | Rebuild as one stroked path (about 7 kB, R§8.4)     |
| R5  | Page rendered without the CRM theme                  | `ThemedChunkLoader` around the lazy page            |
| R6  | Visual baselines regenerated from stale code         | Pinned Playwright container or CI artifact only     |
| R7  | Fable flags intended deviations as defects           | Centring and copy assumptions given to the reviewer |
| R8  | Status branch rarely reached in production           | Unit matrix M-2 with `createMemoryRouter` (R§3.4)   |
| R9  | memlab away page is the 404 page                     | Keep the page leak-free; memlab runs in CI          |
| R10 | Existing back-to-main a11y exception over-matches    | Labels without the `UITypography` span (R§8.2)      |
| R11 | Missing focus style on the outlined button           | Visible `:focus-visible` outline (WCAG 2.4.7)       |

## 10. Open Questions and Follow-ups

Each is resolved autonomously for planning; the PRD may revisit them.

- **TODO (tracked here and in the PR, not in code):** wire "Запросити доступ" to an
  access-request flow once one exists (RBAC #114).
- **Design confirmation, flagged in the PR:** the 5xx copy, the "На жаль" orthography, the
  white-on-primary contrast, the `#969B9D` outlined border (2.81:1), and the centred tablet card.
- Does the PR close #309?

  > Assumption: yes. The app shell and the access-request flow are separate issues.

- Do 403 and 5xx need tablet and mobile parity?

  > Assumption: no; only the 404 has those frames. The pages are responsive through the shared
  > composition, and parity is claimed only for the five frames.

## 11. Next Step

Hand this brief to the PM for `create-prd`, carrying forward G-1 to G-8 as functional scope, M-1
to M-11 as acceptance criteria, section 8 as NFRs, section 9 as the risk register and the
binding copy table as the i18n contract.
