---
status: 'complete'
workflowType: 'epics'
stepsCompleted:
  - 'step-01-validate-prerequisites'
  - 'step-02-design-epics'
  - 'step-03-create-stories'
  - 'step-04-final-validation'
project_name: 'crm'
date: '2026-10-01'
issue: 309
branch: 'feat/309-error-pages'
base: 'origin/main cff55203'
author: 'pm (John), autonomous run'
inputDocuments:
  - 'https://github.com/VilnaCRM-Org/crm/issues/309'
  - 'specs/309-error-pages/planning-artifacts/research-309-error-pages-2026-10-01.md'
  - 'specs/309-error-pages/planning-artifacts/brief-309-error-pages-2026-10-01.md'
  - 'specs/309-error-pages/planning-artifacts/prd-309-error-pages-2026-10-01.md'
  - 'specs/309-error-pages/planning-artifacts/architecture-309-error-pages-2026-10-01.md'
  - '/home/dima/Desktop/crm-worktrees/plans/309-research-codebase.md'
  - '/home/dima/Desktop/crm-worktrees/plans/309-figma-spec.md'
  - '/home/dima/Desktop/crm-worktrees/plans/309-research-gates.md'
  - 'Figma file xZ7ccrH6d4QyqLQsayFSEX, nodes 143:12154, 143:12166, 143:12178, 172:6675, 172:6914'
  - 'specs/250-ui-toolkit/planning-artifacts/epics-250-ui-toolkit-2026-09-29.md (format precedent)'
  - 'CLAUDE.md'
  - '.claude/react-sdlc.yml'
  - '.husky/pre-commit'
  - '.markdownlint.yaml'
---

# Epics and Stories: 404 / 403 / 5xx error pages from Figma (#309)

**Author:** pm (John), autonomous BMAD run. **Date:** 2026-10-01. **Issue:**
[#309](https://github.com/VilnaCRM-Org/crm/issues/309). **Status:** complete.

Predecessors: [technical research](./research-309-error-pages-2026-10-01.md) ("R§n"),
[product brief](./brief-309-error-pages-2026-10-01.md) ("B§n"),
[PRD](./prd-309-error-pages-2026-10-01.md) ("FR-n", "NFR-n", appendix "A.n") and
[architecture](./architecture-309-error-pages-2026-10-01.md) ("AD§n", decisions "D-n"). The
pixel-level Figma note `plans/309-figma-spec.md` is cited "F§n". This document does not re-open
any product owner decision (PRD UD-1 to UD-10) or any architecture decision (D-1 to D-13).

## Overview

This document breaks the PRD's 20 FRs and 22 NFRs and the architecture's decisions D-1 to D-13
into 6 epics and 16 stories, plus one pull-request stage that is not a story. Every story is
sized for one implementing agent, names the files it touches, the tests it adds or changes, its
local and CI verification, one explicit `Dependency:` line for parallel dispatch, its acceptance
criteria and its commit group.

**Dispatch set of this pull request:** Stories 1.1 to 6.1, then the pull-request stage. Nothing
else is dispatched. The last story (6.1) is the Fable pixel-perfect verification against the five
Figma frames with a measured overlay diff per frame; the documentation story is 5.2.

> Assumption: this is a brownfield change with no starter template, so Epic 1 Story 1 is the
> first data change, not a project setup (step 4 starter-template check: not applicable).
>
> Assumption: the architecture's suggested order (AD§20) is kept, with its seven steps split
> into smaller stories so that independent work can be dispatched in parallel waves.

## Requirements Inventory

### Functional Requirements

- FR-1: One shared presentational error page renders all three statuses from one configuration
  per status; configuration is data; 0 jscpd clones.
- FR-2: The catch-all route (`ROUTE_PATHS.notFound`, `'*'`) renders the designed 404 page; the
  `not-found` chunk name and import path stay; `UIBackToMain` is gone from the page.
- FR-3: `/forbidden` renders the designed 403 page, public, no redirect with or without a token.
- FR-4: `/server-error` renders the designed 5xx page (`5xx` digits, one home action, no retry).
- FR-5: `ROUTE_PATHS` gains `forbidden` and `serverError`; the `app.shell` contract gains two
  public lazy routes; `registry.ts`, `route-composer.tsx` and `routes.tsx` are not edited.
- FR-6: `RouteError` renders the 404, 403 or 5xx page for status 404, 403 or 500 to 599, read
  from a router error response or a `Response` / `data()` value thrown during render, lazily
  and themed; every other error keeps `ErrorFallback`; a failed
  error-page chunk falls back to `ErrorFallback`; reporting is unchanged.
- FR-7: 404 and 5xx show one primary home link; 403 shows an outlined home link then a primary
  "Запросити доступ"; every home action is `href="/"`.
- FR-8: "Запросити доступ" is an inert, focusable `<button type="button" aria-disabled="true">`
  (never `disabled`; accessibility-lead decision); the TODO lives in the
  specs and the PR body, never in a code comment.
- FR-9: uk and en copy per the PRD table; one owner per key; `route_fallback.loading` keeps an
  owner; "На жаль" instead of the design's "Нажаль".
- FR-10: `document.title` is "<title> - VilnaCRM", follows language changes, resets on unmount.
- FR-11: One focused `h1`; `main` or a labelled region; `lang`; decoration and digits
  `aria-hidden`, the status code exposed once by a visually hidden `error_page.<variant>.code`
  line (WCAG 1.3.1); visible `:focus-visible` on both button styles, proved by `visibleFocus:
true` tab stops; tab order; 44 px targets; on a short landscape viewport the page may open
  scrolled to the focused `h1` (accepted, flagged).
- FR-12: Desktop composition (1440) per appendix A.1.
- FR-13: Tablet composition (1024) per appendix A.2.
- FR-14: Mobile composition (375) per appendix A.3 (glyph tops 14.582 / 37.324 / 14.582); 320
  to 374 px fits without horizontal scroll, with the digits and card inside the viewport, the
  text inside a 16 px inset and the yellow tab kept inside the card.
- FR-15: `#FBFBFB` page background, centred composition, 76 / 43.61 px top offsets, footer gap
  of at least 121 / 73.91 px.
- FR-16: The footer renders exactly once in both landmark modes; `UIFooter` is unchanged.
- FR-17: Direct unit tests per new `src` file, jest-axe, E2E, a11y route lane, visual specs and
  the route-coverage manifest rows.
- FR-18: ADR-018 records the status branch and the lost in-place retry; docs are synced.
- FR-19: A Fable-model reviewer verifies parity against the five frames before the PR opens.
- FR-20: The PR closes #309 and flags every design deviation and the request-access TODO.

### NonFunctional Requirements

- NFR-1 to NFR-3: element boxes within ±1 CSS px (±1.5 px at 375), text runs within tolerance,
  exact colour, opacity, shadow and type.
- NFR-4: Fable raster crop mismatch at most 1.5 % (desktop, tablet) and 3 % (mobile), on
  full-resolution Figma exports (`maxDimension` = frame's longer edge) with per-frame masks.
- NFR-5: 0 visual diff against committed baselines in chromium, firefox and webkit.
- NFR-6: deterministic rendering for the visual lane; `retries: 0`; flake budget 0.
- NFR-7: WCAG 2.1 AA, including 1.4.4 and 1.4.10 (320 px reflow checks), 1.4.12 (the
  text-spacing spec of Story 3.3), 2.4.7 and 2.5.3.
- NFR-8: exactly two new scoped `A11Y_EXCEPTIONS` entries, both tracked by #276: white on
  `#1EAEFF` (`#error-page-actions > .MuiButton-contained`) and the decorative status digits
  (`#error-page-digits > span`, 2.37:1 and 1.58:1).
- NFR-9: 0 axe violations outside NFR-8 in the jest-axe and route lanes.
- NFR-10: the eager graph keeps its single `@mui/*` edge; no budget value changes.
- NFR-11: eager gzip delta at most 2,048 B; each new chunk under the per-asset budgets;
  decoration assets at most 20 kB raw in total.
- NFR-12: `/forbidden` and `/server-error` join the Lighthouse URLs and pass the existing
  `lighthouserc` assertions (desktop 0.95 performance, accessibility, best practices and 0.90
  SEO; mobile 0.84 median-run performance and 0.90 accessibility, best practices and SEO) and
  the resource budgets; the profile's mobile 85 for the two error routes is read from the LHCI
  report and recorded in the PR; no request is added to the existing three.
- NFR-13: `RouteFallback` deferred paint covers the lazy page; memlab reports no leak.
- NFR-14: `make lint-i18n` passes.
- NFR-15: Jest coverage 100 / 100 / 100 / 100.
- NFR-16: Stryker `break` 100 with 0 survivors; every new `src` file directly tested.
- NFR-17: 0 ESLint, `tsc` and dependency-cruiser findings; no suppression of any kind.
- NFR-18: 0 jscpd clones (`minTokens` 70), 0 rust-code-analysis failures, 0 markdown findings.
- NFR-19: the console gate stays installed with an empty allowlist; E2E uses the console fixture
  (language-switch output is covered by the unit card test; the app has no switcher UI).
- NFR-20: committed same-origin assets only; no Figma MCP asset URL; no new dependency.
- NFR-21: every listed CI check is green on the PR head.
- NFR-22: no heavy suite runs locally; baselines never come from a reused prod container.

### Additional Requirements

From the architecture (each decision binds the stories that name it):

- AR-1 (D-1): one presentational `ErrorPage` in `src/components/error-page/`, driven by
  `variant` and `landmark`.
- AR-2 (D-2): `ERROR_PAGE_VARIANTS` and `ERROR_PAGE_GEOMETRY` are data-only tables in the lazy
  chunk; geometry holds appendix A's values verbatim, with desktop/tablet-identical sub-records
  (`LARGE_DIGITS`, `LARGE_PAGE`, `LARGE_CARD_SURFACE`) declared once (AD§8.3, jscpd).
- AR-16 (AD§14.1): styles are six area classes plus `ErrorPageResponsiveStyles.compose`; every
  private fragment method reads one breakpoint's geometry; no closures; at most four tokens per
  class (spike-measured under the rust-code-analysis caps).
- AR-17 (AD§12): the programmatically focused `h1` renders `outline: none` on `:focus`; the
  `:focus-visible` rings belong to the buttons only.
- AR-3 (D-3): `RouteError` becomes a two-way dispatcher; today's body moves unchanged into
  `RouteErrorFallback`.
- AR-4 (D-4): the eager, MUI-free `ErrorPageStatusDetector` maps 403, 404 and 500 to 599 to a
  variant id and everything else to `null`, reading the status from a router error response, a
  render-thrown `Response` or a `data()` value (AD§5.2: the route contract has no loaders).
- AR-5 (D-5): `RouteErrorPage` lazy-loads `@/components/error-page` (`webpackChunkName:
"error-page"`) through `ThemedChunkLoader` and `ChunkRetryLoader`, falling back to
  `RouteErrorFallback` on chunk failure.
- AR-6 (D-6): `ThemedChunkLoader` and `ComponentModule` gain a defaulted props type parameter;
  existing call sites compile unchanged.
- AR-7 (D-7): illustration assets live in `src/assets/illustrations/error-page/`, imported as
  svgr `ReactComponent`s and coloured through `currentColor`; tab and dot are CSS.
- AR-8 (D-8): desktop above 1024 px, tablet 768 to 1024 px, mobile below 768 px; parity is
  claimed only at 1440, 1024 and 375.
- AR-9 (D-9): new colour tokens in `customColors`; text sizes in `rem`, geometry in `px`.
- AR-10 (D-10): home actions are `UIButton to="/"` anchors; "Запросити доступ" is a
  `UIButton` with no `to`, rendering `<button type="button">` with no handler.
- AR-11 (D-11): `forbidden: '/forbidden'` and `serverError: '/server-error'` in `ROUTE_PATHS`
  and the `app.shell` contract as public lazy pages.
- AR-12 (D-12): catalog namespace `error_page.*` owned by `src/components/error-page/i18n/`;
  `not_found.*` deleted; `route_fallback.loading` moves to `src/components/route-fallback/i18n/`.
- AR-13 (D-13): new ADR-018; ADR-007 gains one Links line only.
- AR-14 (AD§8.4): digits are DOM text in three spans inside the `aria-hidden`
  `#error-page-digits` box; their 1.4.3 failure carries the second scoped `A11Y_EXCEPTIONS`
  entry (#276); no CSS generated content; the code they show is exposed once by a visually
  hidden `p` with `error_page.<variant>.code` right after the `h1` (WCAG 1.3.1).
- AR-18 (AD§8.2): title and description keep a 24 / 24 / 16 px text inset from the card's inner
  edges; the actions row is not inset.
- AR-15 (AD§15, NFR-22): locally only focused Jest, ESLint, Prettier, `tsc`, `make lint-i18n`,
  `make i18n-generate`, `make check-e2e-route-coverage` and the cheap Docker linters; E2E,
  visual, a11y-e2e, mutation, bundle size, memlab and Lighthouse are CI-only.

### UX Design Requirements

No separate UX document exists; the five Figma frames are the UX source, measured into the PRD
appendix A and the architecture sections 8 to 10.

- UX-DR1: one composition per frame: digits, yellow tab, card, decoration layer, in the paint
  order tab, curve, digits, card, diamond, dot, dot columns or rows (FR-12).
- UX-DR2: digits Golos 700 with a hard `0 4px 0` shadow, middle glyph 36 px lower, row
  left-aligned in its frame; per-status fill and shadow colours (FR-12, FR-14).
- UX-DR3: white card with a 1 px inside border, radius 16, soft shadow, centred title,
  description and actions with the drawn vertical rhythm (FR-12 to FR-14).
- UX-DR4: pill buttons, radius 57, primary `#1EAEFF` and outlined `#969B9D` border; 403 row of
  two buttons 8 px apart (FR-7).
- UX-DR5: decoration: dashed curve, diamond, dot, four dot columns (desktop, tablet) or four dot
  rows (mobile) (FR-12 to FR-14).
- UX-DR6: three breakpoints, 1440, 1024 and 375 parity widths (FR-12 to FR-14, AR-8).
- UX-DR7: `#FBFBFB` background, centred composition, 76 / 43.61 px top offset, footer below
  (FR-15, FR-16).
- UX-DR8: header and sidebar drawn in the frames are not built (UD-8).

### FR Coverage Map

| Requirement    | Stories                             |
| -------------- | ----------------------------------- |
| FR-1           | 1.2, 2.1, 2.3, 2.4                  |
| FR-2           | 3.1                                 |
| FR-3, FR-4     | 3.2                                 |
| FR-5           | 3.2                                 |
| FR-6           | 4.1, 4.2                            |
| FR-7, FR-8     | 2.2, 3.2                            |
| FR-9           | 1.1, 2.3, 3.1                       |
| FR-10          | 2.4, 3.2                            |
| FR-11          | 2.2, 2.3, 2.4, 3.3                  |
| FR-12 to FR-15 | 1.2, 2.1, 2.2, 2.3, 2.4, 3.2, 6.1   |
| FR-16          | 2.4, 4.2                            |
| FR-17          | 2.4, 3.1, 3.2, 3.3, 3.4, 4.2, PR    |
| FR-18          | 5.1, 5.2                            |
| FR-19          | 6.1                                 |
| FR-20          | PR stage                            |
| NFR-1 to NFR-4 | 6.1                                 |
| NFR-5, NFR-6   | 3.1, 3.2, 6.1, PR stage             |
| NFR-7 to NFR-9 | 2.2, 2.3, 2.4, 3.2, 3.3             |
| NFR-7 (1.4.12) | 3.3 (text-spacing spec)             |
| NFR-10, NFR-11 | 2.1, 4.2, PR stage (bundle comment) |
| NFR-12, NFR-13 | 3.1, 3.4, 4.2, PR stage             |
| NFR-14         | 1.1, 3.1                            |
| NFR-15 to 19   | every story (Story Conventions)     |
| NFR-20         | 2.1                                 |
| NFR-21, NFR-22 | every story, PR stage               |

## Epic List

1. **Epic 1: The shared error page has its copy, tokens, geometry and a props-forwarding
   loader.** Data and plumbing every later story builds on. FRs: FR-1 (part), FR-9, FR-12 to
   FR-15 (data).
2. **Epic 2: One shared `ErrorPage` renders the designed composition for every status.** The
   lazy, themed, accessible page with its decoration, digits, card and actions. FRs: FR-1,
   FR-7, FR-8, FR-10, FR-11, FR-12 to FR-16.
3. **Epic 3: Users reach the 404, 403 and 5xx pages by URL.** The catch-all rework and the two
   new public routes with their browser and Lighthouse coverage. FRs: FR-2 to FR-5, FR-17,
   NFR-12.
4. **Epic 4: A route error response with a known status shows the designed page.** The status
   detector and the lazy dispatch inside `RouteError`. FRs: FR-6, FR-16 (region mode).
5. **Epic 5: Reviewers and contributors find the decision and the new routes documented.**
   ADR-018 and the doc sync. FRs: FR-18.
6. **Epic 6: The pages are verified pixel-perfect against Figma.** The Fable measured overlay
   review per frame. FRs: FR-19, NFR-1 to NFR-4.

Epic 2 builds on Epic 1. Epic 3 and Epic 4 both build on Epic 2 and are independent of each
other. Epic 5 documents what Epics 2 to 4 deliver. Epic 6 verifies the finished pages and comes
last; the pull-request stage follows it.

## Story Conventions

- **Fields:** user story, requirements, files, tests, local verification, CI verification, one
  `Dependency:` line, acceptance criteria and the commit group, in that order.
- **Dependency marks:** `Dependency: independent` or `Dependency: depends on Story N.M[, ...]`.
  This is the `/fe-sdlc-implement` dispatch input: a story may start once every story it names
  is complete. Stories with no mutual dependency may run in the same wave, unless the dispatch
  table lists a shared file between them, in which case they run one after the other.
- **Local-light verification** runs from the worktree root: focused Jest on the touched test
  files (`docker compose exec -T dev bun x jest <paths> --coverage=false`, or the host toolchain
  when the dev container's `node_modules` volume is stale), ESLint and Prettier on the changed
  files, `make lint-tsc`, and the cheap targets named per story. Nothing else runs by hand
  (AR-15).
- **CI-only verification** is named as `<workflow> / <job>`, exactly as AD§17 lists it.
- **Always binding, for every story:**
  - no suppression artifact of any kind (no disable or ignore directive, no Stryker
    annotation, no allowlist widening beyond the two NFR-8 entries, no threshold or budget edit,
    no `gate-relaxation` label);
  - no added code comment in source, tests or config (the request-access TODO is tracked in
    these specs and the PR body only);
  - non-React `.ts` logic is a class with instance methods exported as a singleton, with an
    approved class-name suffix; data files hold no function-valued property;
  - every type lives in a type-only file and is imported with `import type`;
  - no `data-testid`; tests query by role, name, text or landmark;
  - every new `src` file has a direct test at the mirrored `tests/unit/` path; module-scope
    literals are loaded inside the test through `tests/unit/utils/isolated-module.ts`;
  - every test follows the liveness rules (no skip, focus, conditional `expect` or
    assertion-free test); lazy renders are awaited with `findBy…`; a test that throws through a
    route passes `onCaughtError` and asserts it; no file-wide console spy;
  - `make format` before `make lint`, per `CLAUDE.md`.
- **Accessibility hook:** the global edit hook blocks `.tsx` edits until the
  `accessibility-lead` agent has run in the session. The implement stage runs it once from the
  main loop before the first UI story; implementation subagents do not.
- **Commit groups:** the Husky pre-commit hook runs `make format`, `git add -A`, `make lint` and
  `make test-unit-all`; the last is a full suite, which NFR-22 and the user's standing rule keep
  off this machine. **Default path (decision):** after a group's local-light checks pass,
  commit with `HUSKY=0`, stage files explicitly (never `git add -A`), run commitlint by hand
  (`bun x commitlint --from origin/main`), and let CI verify; the PR body states this. This is
  the #306 / #307 precedent recorded in the gates note (section 12). Several stories cannot be
  green alone (a data file or the status detector is a dependency-cruiser orphan until a later
  story imports it), and CI checks every pushed head, so stories still commit in five groups:

| Group | Stories                                | Why the boundary                             |
| ----- | -------------------------------------- | -------------------------------------------- |
| A     | 1.1, 1.2, 1.3, 2.1, 2.2, 2.3, 2.4, 3.1 | `ErrorPage` first gets an importer in 3.1    |
| B     | 4.1, 4.2                               | The detector first gets an importer in 4.2   |
| C     | 3.2, 3.3, 3.4                          | Route keys, specs, manifest and Lighthouse   |
| D     | 5.1, 5.2                               | Docs describe what A to C committed          |
| E     | 6.1 (only when it fixes a defect)      | Content-area fixes found by the Fable review |

> Assumption: groups B and C both follow A and are independent of each other, but they share
> `tests/unit/tooling/performance-serving.test.ts`, so they run one after the other in the one
> worktree (B first is recommended, so the route specs of C exercise the final `RouteError`).
> A commit is taken only when no story outside its group is in flight.
>
> Assumption: running the hook is the exception, taken only if the user explicitly approves a
> local full unit run; otherwise the `HUSKY=0` default above applies at every commit point, and
> CI remains the verifier either way.
>
> Assumption: `specs/309-error-pages/` is untracked when implementation starts; it is staged
> explicitly into the group A commit (every earlier `specs/*` folder is tracked and
> markdownlint ignores `**/planning-artifacts/`).

### Dispatch Table

| Story | Dependency                    | Group | Shared files (run serially with)                 |
| ----- | ----------------------------- | ----- | ------------------------------------------------ |
| 1.1   | independent                   | A     | `localization.json` (3.1)                        |
| 1.2   | depends on 1.1                | A     | -                                                |
| 1.3   | independent                   | A     | -                                                |
| 2.1   | depends on 1.2                | A     | -                                                |
| 2.2   | depends on 1.2                | A     | -                                                |
| 2.3   | depends on 1.2, 2.2           | A     | `axe-config.ts` (2.2; serial by dependency)      |
| 2.4   | depends on 2.1, 2.3           | A     | -                                                |
| 3.1   | depends on 2.4                | A     | `localization.json` (1.1), `visual/constants.ts` |
| 4.1   | depends on 1.2                | B     | -                                                |
| 4.2   | depends on 1.3, 2.4, 4.1      | B     | `performance-serving.test.ts` (3.2)              |
| 3.2   | depends on 3.1                | C     | `performance-serving.test.ts`, `route-coverage`  |
| 3.3   | depends on 3.2                | C     | `route-coverage.tsv` (3.2)                       |
| 3.4   | depends on 3.2                | C     | -                                                |
| 5.1   | independent                   | D     | -                                                |
| 5.2   | depends on 2.2, 3.3, 4.2, 5.1 | D     | -                                                |
| 6.1   | depends on 3.3, 4.2, 5.2      | E     | any file a fix touches                           |

Waves inside the one worktree: **A1** 1.1, 1.3; **A2** 1.2; **A3** 2.1, 2.2; **A4** 2.3;
**A5** 2.4; **A6** 3.1, then commit A; **B1** 4.1; **B2** 4.2, then commit B; **C1** 3.2;
**C2** 3.3, 3.4, then commit C; **D1** 5.1 (independent, so it may also be drafted in any earlier
wave); **D2** 5.2, then commit D; **E** 6.1.

> Assumption: Story 4.1 is not started before commit A, because its detector file would be a
> dependency-cruiser orphan in the tree CI lints at the group A head. Story 5.1 has
> no such effect; if it is drafted early and swept into an earlier commit, that is harmless.

## Epic 1: The shared error page has its copy, tokens, geometry and a props-forwarding loader

The catalog, the colour tokens, the type file, the three data tables and the generic
`ThemedChunkLoader` exist and are pinned by direct tests, so the component stories only compose
them. Covers FR-1 (data), FR-9, the data side of FR-12 to FR-15, AR-2, AR-6, AR-9, AR-12.

### Story 1.1: Add the `error_page` catalog and rehome `route_fallback.loading`

As a uk or en user,
I want every error-page string to exist in both languages under one owning catalog,
So that the pages render the binding copy and the locale gate stays green.

**Requirements:** FR-9, NFR-14, AR-12.

**Files:**

- `src/components/error-page/i18n/uk.json`, `en.json` (new): the eleven `error_page.*` keys of
  AD§13 with the exact uk and en values of the PRD FR-9 table.
- `src/components/route-fallback/i18n/uk.json`, `en.json` (new): `route_fallback.loading` with
  its current values, unchanged.
- `src/components/not-found/i18n/uk.json`, `en.json`: `route_fallback.loading` removed;
  `not_found.*` stays until Story 3.1 deletes the folder.
- `src/i18n/localization.json`: regenerated by `make i18n-generate`.

**Tests:** no new unit test (catalogs are data under `/i18n/`, outside coverage and mutation);
`tests/unit/components/route-fallback/*` must pass unedited.

**Verification (local-light):** `make i18n-generate`; `make lint-i18n`; focused Jest on
`tests/unit/components/route-fallback/`; Prettier on the four JSON files.

**Verification (CI-only):** `static testing / static` (`lint-i18n`); `unit testing / unit`.

Dependency: independent

**Acceptance Criteria:**

- **Given** the new catalog, **When** `make lint-i18n` runs, **Then** it passes, **And** uk
  and en hold the same eleven keys with non-empty values that equal the PRD FR-9 table character
  for character, including "На жаль, у вас немає прав доступу до цієї сторінки" and the three
  `error_page.<variant>.code` lines ("Код помилки: 404 / 403 / 5xx", "Error code: …").
- **Given** the merged `localization.json`, **When** it is regenerated, **Then**
  `route_fallback.loading` keeps its current uk and en values, **And** `RouteFallback` and its
  tests are unchanged.
- **Given** the existing catalogs, **When** the new ones are added, **Then** no key is declared
  twice: `buttons.back_to_main` and `error_boundary.go_home` keep their owners and are not
  re-declared (only the en value "Go to homepage" is reused).
- **Given** the digits, **When** the catalog is reviewed, **Then** no glyph (`4`, `0`, `3`,
  `5`, `x`) is a catalog value.

Commit group: A.

### Story 1.2: Add the colour tokens, the type file and the three data tables

As an implementer of the page components,
I want every colour, every appendix A number and every per-status difference to exist once, as
pinned data,
So that components and style builders read values instead of hard-coding Figma numbers.

**Requirements:** FR-1 (configuration), FR-12 to FR-15 (data), NFR-16, NFR-18, AR-2, AR-8,
AR-9.

**Files:**

- `src/styles/colors.ts`: the eleven `customColors` tokens of AD§9.2 (`surface.page`,
  `text.heading`, `brand.darkPrimary`, `digitShadow.{primary,dark,secondary}`,
  `decorative.{curve,diamond,dot,dotGrid}`, `shadow.card`).
- `src/components/types/error-page/index.ts` (new, type-only): `ErrorPageVariantId`,
  `ErrorPageHomeAppearance`, `ErrorPageBreakpoint`, `ErrorPageVariant`, `ErrorPageProps`
  (reusing `FallbackLandmark`), `ErrorPageGeometry` with its sub-record types and the six
  style-sheet types (AD§4.1).
- `src/components/error-page/error-page-variants.ts` (new): default-exported
  `ERROR_PAGE_VARIANTS` (`as const satisfies Record<ErrorPageVariantId, ErrorPageVariant>`) with
  the AD§4.2 table, plus `ERROR_PAGE_TITLE_ID = 'error-page-title'`,
  `ERROR_PAGE_ACTIONS_ID = 'error-page-actions'` and `ERROR_PAGE_DIGITS_ID = 'error-page-digits'`.
- `src/components/error-page/error-page-geometry.ts` (new): `ERROR_PAGE_GEOMETRY`, one record
  per breakpoint with the appendix A.1 to A.3 values and the AD§8.3 field list verbatim; the
  desktop/tablet-identical sub-records `LARGE_DIGITS`, `LARGE_PAGE` and `LARGE_CARD_SURFACE`
  are module-level `const`s referenced from both breakpoints (never written out twice); the tab
  is stored as `left` / `right` insets, the description has no width field, the card carries
  `textInset` 24 / 24 / 16 (24 inside `LARGE_CARD_SURFACE`), and the mobile glyphs carry their
  tops (14.582 / 37.324 / 14.582).
- `src/components/error-page/error-page-media.ts` (new): `ERROR_PAGE_MEDIA`, the tablet
  `max-width: 1024px` and mobile `breakpointsTheme.breakpoints.down('md')` strings built from
  `ui-breakpoints`.
- `src/components/error-page/responsive-styles.ts` (new): class `ErrorPageResponsiveStyles`, one
  public `compose(desktop, tablet, mobile)` that returns `{ ...desktop, [tablet query]: tablet,
[mobile query]: mobile }` (AD§14.1), exported as a singleton.

**Tests (new, each loads its module inside the test):**

- `tests/unit/components/error-page/error-page-variants.test.ts`: `toEqual` on the full table and
  the three id constants.
- `tests/unit/components/error-page/error-page-geometry.test.ts`: `toEqual` on every breakpoint
  record against appendix A.
- `tests/unit/components/error-page/error-page-media.test.ts`: the two exact query strings.
- `tests/unit/components/error-page/responsive-styles.test.ts`: isolated load; `compose` places
  the desktop fragment at the top level and the tablet and mobile fragments under the exact
  `ERROR_PAGE_MEDIA` keys.

**Verification (local-light):** focused Jest on the four tests; ESLint, Prettier and
`make lint-tsc`; `make lint-i18n` (the `*Key` literals of the variant table are scanned);
`make lint-dup` and `make lint-metrics`.

**Verification (CI-only):** `unit testing / unit`; `static testing / static`;
`mutation testing / merge and enforce gate`.

Dependency: depends on Story 1.1

**Acceptance Criteria:**

- **Given** the variant table, **When** it is loaded, **Then** it equals AD§4.2 exactly:
  glyphs `4 0 4`, `4 0 3`, `5 x x` (lower-case `x`), the digit fill and shadow tokens, the
  `error_page.*` title, description and code keys, `contained` / `outlined` / `contained` and
  `requestAccess` true only for `forbidden`.
- **Given** `make lint-i18n`, **When** it scans the `titleKey`, `descriptionKey` and `codeKey`
  literals,
  **Then** every one resolves in uk and en.
- **Given** the geometry table, **When** it is compared with appendix A, **Then** every number
  is copied without rounding (for example 350.348, 243.912, 154.462, 11.826), the mobile `dot`
  and `dotColumns` are `null`, and desktop and tablet `dotRows` are `null`.
- **Given** the mobile digits, **When** the geometry test reads them, **Then** the glyphs are
  at (27.739, 14.582), (120.606, 37.324) and (217.896, 14.582), while desktop and tablet are at
  (0, 0), (147, 36) and (301, 0).
- **Given** the tab, **When** the geometry is read, **Then** it holds insets left / right 37 / 37,
  26 / 27 and 19.216 / 19.958 and no width.
- **Given** the card, **When** the geometry is read, **Then** `textInset` is 24, 24 and 16.
- **Given** the dot and the mobile dot rows, **When** the geometry is read, **Then** the values
  are the rotated nodes' `absoluteBoundingBox` / `absoluteRenderBounds` (never `node.x` /
  `node.y`): dot circle 10.338 x 10.354 centred at O(574.921, 99.928) on desktop and 10.529 x
  10.354 at O(558.255, 99.928) on tablet; mobile `dotRows` width 161.541, height 59.091,
  `gapBelowCard` 19.779; page `paddingBottom` 121 / 121 / 73.91 and composition
  `paddingBottom` 0 / 0 / 78.87.
- **Given** `make lint-dup`, **When** it runs over `src`, **Then** it reports 0 clones, **And**
  the desktop and tablet records reference the shared `LARGE_*` sub-records instead of
  repeating them.
- **Given** the three data files, **When** ESLint runs, **Then** the #100 and #180 selectors
  pass because no property is function-valued.
- **Given** the new tokens, **When** the type augmentation is compiled, **Then** `make lint-tsc`
  passes with no hand-edited type, **And** no colour literal used by the page exists outside
  `src/styles/colors.ts`.
- **Given** Stryker, **When** it mutates the three data files, **Then** every literal mutant is
  killed by the isolated-load tests.

Commit group: A.

### Story 1.3: Make `ThemedChunkLoader` forward props

As the route-error dispatcher,
I want the themed lazy loader to pass `variant` and `landmark` through to the loaded page,
So that one loader serves every status and landmark without six prop-less copies.

**Requirements:** FR-6 (prerequisite), NFR-10, NFR-17, AR-6.

**Files:**

- `src/components/types/providers/index.ts`: `ComponentModule<TProps>` with a default type
  parameter that keeps today's meaning (the form `tsc` and `@typescript-eslint` accept without
  `{}`).
- `src/providers/mui-theme/themed-chunk-loader.ts`: generic over `TProps`; `Themed(props)`
  renders `createElement(Shell, null, createElement(Content, props))`.

**Tests:** `tests/unit/providers/mui-theme/themed-chunk-loader.test.tsx` gains one case: props
reach the content inside the shell. `tests/unit/routes/route-mapper*.test.tsx` and the footer
loader tests pass unedited.

**Verification (local-light):** focused Jest on the themed-loader, route-mapper and
`app-layout` tests; `make lint-tsc`; ESLint on the two files.

**Verification (CI-only):** `unit testing / unit`; `mutation testing / merge and enforce gate`;
`bundle size / measure and gate`.

Dependency: independent

**Acceptance Criteria:**

- **Given** `footer-loader.ts` and `route-mapper.tsx`, **When** they compile on the default type
  parameter, **Then** neither file changes.
- **Given** a loader typed with `{ variant, landmark }`, **When** the themed component renders
  with those props, **Then** the content receives them inside the MUI theme shell.
- **Given** `performance-serving.test.ts`, **When** it walks the eager graph, **Then** the only
  `@mui/*` edge is still `app-providers.tsx -> @mui/material/styles`.

Commit group: A.

## Epic 2: One shared `ErrorPage` renders the designed composition for every status

The page is built from small one-component files that read the Epic 1 data. It renders as a
`main` with the footer or as a labelled region without it, focuses its `h1`, hides all
decoration from assistive technology and lives entirely in the lazy `error-page` graph. Covers
FR-1, FR-7, FR-8, FR-10, FR-11, FR-12 to FR-16, NFR-7 to NFR-9, NFR-20, AR-1, AR-7, AR-10,
AR-14.

### Story 2.1: Ship the decoration assets and `ErrorPageIllustration`

As a user,
I want the dashed curve, diamond, dot and dot grid drawn exactly where the design puts them,
So that the page looks like the frames at every breakpoint.

**Requirements:** FR-12 to FR-14 (decoration), FR-11 (hidden art), NFR-11 (asset size),
NFR-20, AR-7, UX-DR5.

**Files:**

- `src/assets/illustrations/error-page/curve.svg` (new): one `<path>` of the 243 dash end-point
  pairs of F§1.5, `viewBox="0 0 643 357"`, `fill="none"`, `stroke="currentColor"`,
  `stroke-width="1.5"`, butt caps. Converted once in a scratch script outside the repository; no
  generator is committed.
- `src/assets/illustrations/error-page/diamond.svg` (new): the verbatim F§1.5 ring path,
  `viewBox="0 0 40 40"`, `fill="currentColor"`.
- `src/assets/illustrations/error-page/dot-columns.svg`, `dot-rows.svg` (new): `<circle
r="3.36">` columns 4 / 6 / 8 / 10 and the transposed rows 10 / 8 / 6 / 4, `fill="currentColor"`.
- Every root carries `viewBox` and `preserveAspectRatio="none"` and no `width` or `height`
  attribute; sizes come from CSS only, so svgo's `removeViewBox` keeps the `viewBox` with no
  svgo configuration change (AD§7.1).
- `src/components/error-page/illustration-styles.ts` (new): class
  `ErrorPageIllustrationStyles`, `build()` with tokens tab, curve, diamond and one private
  fragment method per token that reads one breakpoint's geometry (AD§14.1); the tab uses the
  `left` / `right` insets.
- `src/components/error-page/dot-styles.ts` (new): class `ErrorPageDotStyles`, the same shape
  for dot, dot columns and dot rows; a `null` geometry block yields `{ display: 'none' }`, and
  every non-null fragment of these nullable tokens declares `display: 'block'` (the mobile
  `dotRows` fragment must, or the base `display: none` hides the rows below 768 px; the desktop
  and tablet `dot` and `dotColumns` fragments do too, for symmetry; AD§14.1).
- `src/components/error-page/error-page-illustration.tsx` (new): one `aria-hidden="true"` layer
  rendering the CSS tab and dot and the four svgr components with `focusable="false"`.

**Tests (new):**

- `tests/unit/components/error-page/illustration-styles.test.ts`: isolated load, `toEqual` on
  every token, including the three breakpoint blocks, the `#FFC01E` tab with its insets and the
  opacity 0.3 curve.
- `tests/unit/components/error-page/dot-styles.test.ts`: isolated load, `toEqual` on every
  token, including the mobile `display: none` of the dot and dot columns, the desktop and
  tablet `display: none` of the dot rows, the mobile `display: 'block'` of the dot rows and the
  desktop and tablet `display: 'block'` of the dot and dot columns.
- `tests/unit/components/error-page/error-page-illustration.test.tsx`: each SVG mocked as
  `{ ReactComponent: 'svg' }`; the layer is `aria-hidden`, every svg is `focusable="false"`, four
  art elements plus the tab and the dot render.

**Verification (local-light):** focused Jest on the three tests; ESLint, Prettier,
`make lint-tsc`; `make lint-metrics` and `make lint-dup` (cheap Docker linters); `du -cb` on the
four assets; a grep proving no asset root carries `width=` or `height=`.

**Verification (CI-only):** `unit testing / unit`; `mutation testing / merge and enforce gate`;
`bundle size / measure and gate`; `security testing / security headers` (CSP unchanged).

Dependency: depends on Story 1.2

**Acceptance Criteria:**

- **Given** the four assets, **When** they are measured, **Then** they total at most 20 kB raw,
  **And** the curve is about 7 kB, never the 204,356-character pre-outlined Figma path.
- **Given** the repository, **When** it is searched, **Then** no `figma.com/api/mcp/asset` URL
  and no remote image reference exists.
- **Given** the rendered layer, **When** the accessibility tree is read, **Then** nothing inside
  it is exposed, **And** no svg is focusable.
- **Given** a 1440, 1024 or 375 viewport, **When** the styles apply, **Then** each element's
  box equals its appendix A value (curve 643 x 357, 654.86 x 357, 360 x 200; diamond 40, 40.738
  x 40, 29.565; the dot circle centred at O(574.921, 99.928) at 1440 and O(558.255, 99.928) at
  1024), **And** at 375 the dot and the four columns are not displayed while the four rows are
  (`display: block` in the mobile block overrides the base `display: none`), centred under the
  card and 19.78 px below it, the first row's top at O-relative y 437.387.
- **Given** the four asset roots, **When** they are read, **Then** each carries `viewBox` and
  `preserveAspectRatio="none"` and no `width` or `height`, **And** the visual baselines and the
  Story 6.1 review are the checks that the attributes survive svgo (unit tests mock the SVGs).
- **Given** a 320 px viewport, **When** the composition narrows, **Then** the tab's insets keep
  it inside the card's horizontal extent (proved in the browser by Story 3.2's E2E).
- **Given** paint order, **When** the composition stacks, **Then** the z-indexes are tab 1,
  curve 2, diamond, dot and dot grid 5 (digits 3 and card 4 come from Story 2.3).

Commit group: A.

### Story 2.2: Render the actions row with the inert "Запросити доступ" button

As a user,
I want one clear way home on every error page, and the designed request-access button on the
403 page,
So that I can leave the page with the keyboard or the mouse.

**Requirements:** FR-7, FR-8, FR-11 (focus, names, targets), NFR-7, NFR-8, AR-10, UX-DR4.

**Files:**

- `src/components/error-page/action-styles.ts` (new): class `ErrorPageActionStyles` in the
  AD§14.1 shape (`build()`, a private `base`, and row, contained and outlined fragments that
  each read one breakpoint's geometry), one shared base plus two overrides (AD§10.2): no text transform,
  letter-spacing 0, Golos, radius 57, `minHeight` 62 / 70 / 50, padding per breakpoint, the
  outlined `1px solid` `grey[50]` border with `brand.darkPrimary` label and a
  `:focus-visible` outline `2px solid customColors.text.dark` offset 2, and the `UIButton`
  theme's `max-width: 1024px` / `max-width: 375px` padding and `marginBottom: 0` re-pinned under
  the exact theme query strings.
- `src/components/error-page/error-page-actions.tsx` (new): `ErrorPageActions({ variant })`,
  `Box id={ERROR_PAGE_ACTIONS_ID}` (flex row, gap 8, centred, wrap), a home `UIButton
to={ROUTE_PATHS.home}` with the variant's appearance, and for `forbidden` a second
  `UIButton variant="contained"` with no `to`, `href` or handler. Labels are plain text
  children, never `UITypography`.
- `tests/utils/a11y/axe-config.ts`: one appended `A11Y_EXCEPTIONS` entry, rule
  `color-contrast`, selector `#error-page-actions > .MuiButton-contained`, the AD§10.4 reason
  and `trackingUrl: PALETTE_CONTRAST_ISSUE` (#276).

**Tests:**

- `tests/unit/components/error-page/action-styles.test.ts` (new): isolated load, `toEqual` on
  every token and both media blocks.
- `tests/unit/components/error-page/error-page-actions.test.tsx` (new): contained home
  `a[href="/"]` for `notFound` and `serverError`; outlined home then
  `button[type="button"]` "Запросити доступ" for `forbidden`, in that DOM order; clicking the
  button changes nothing; `notFound` and `serverError` render no `button`; the test title names
  the behaviour ("renders the request-access button without an action").
- `tests/unit/a11y/a11y-gate.test.tsx`: passes unedited (validates the new entry's four fields).

**Verification (local-light):** focused Jest on the three tests; ESLint, Prettier,
`make lint-tsc`; `make lint-dup`.

**Verification (CI-only):** `unit testing / unit`; `mutation testing / merge and enforce gate`;
`accessibility testing / axe component gate`; `accessibility testing / axe route scans and
keyboard contract` (after Stories 3.1 and 3.2).

Dependency: depends on Story 1.2

**Acceptance Criteria:**

- **Given** the 403 variant, **When** the row renders, **Then** it shows an outlined home link
  (`#FFFFFF` fill, 1 px `#969B9D` border, `#1B2327` label) followed 8 px later by the primary
  "Запросити доступ" (`#1EAEFF`, white label), 165 x 62 and 228 x 62 at 1440.
- **Given** "Запросити доступ", **When** it is inspected, **Then** it is a native
  `<button type="button">` with `aria-disabled="true"` and no `disabled` attribute, focusable
  and in the tab order (accessibility-lead decision, AD§10.3), with the visible label as
  its accessible name, **And** it has no click handler, `href`, form or navigation.
- **Given** the change set, **When** it is searched, **Then** no `TODO` comment for the button
  exists in `src/` or `tests/`.
- **Given** the 404 and 5xx variants, **When** the row renders, **Then** it holds exactly one
  primary home link 165 x 62 at 1440 and no `button`.
- **Given** keyboard focus, **When** either button style receives `:focus-visible`, **Then** a
  2 px outline with at least 3:1 contrast against `#FFFFFF` and `#FBFBFB` is shown.
- **Given** the back-to-main exception selector
  `a[href="/"].MuiButton-root > span.MuiTypography-root`, **When** the route lane runs, **Then**
  it matches no error-page element, **And** the new entry matches only the contained buttons
  inside `#error-page-actions`, never the outlined link.
- **Given** viewports of 1024 and 375, **When** the `UIButton` theme's own media queries apply,
  **Then** the re-pinned padding wins (70 px button at 1024, 50 px at 375, no 8 px bottom
  margin), **And** every button stays at least 44 px tall.
- **Given** `prefers-reduced-motion: reduce`, **When** a button is hovered, pressed or focused,
  **Then** it has no transition and no ripple, **And** both buttons set `disableFocusRipple`
  (accessibility-lead decision).
- **Given** a 320 px card or WCAG 1.4.12 spacing, **When** the row wraps, **Then** the row's
  4 px inline padding and the buttons' `max-width: 100%` keep every button border box at least
  4 px inside the card box, so the focus ring is never clipped (browser proof in Story 3.3).

> Out of scope, tracked follow-up: wiring "Запросити доступ" to an access-request flow once RBAC
> (#114) provides one. Recorded in the PRD section 13, AD§20 and the PR body under
> "Follow-ups"; never as an inline code comment (UD-4).

Commit group: A.

### Story 2.3: Render the digits and the card

As a user,
I want the large status digits and the card with the title and explanation,
So that I see which error happened, in the design's type and colours.

**Requirements:** FR-9, FR-11 (h1, focus, digits hidden), FR-12 to FR-14 (digits and card),
NFR-7, NFR-8, NFR-9, AR-9, AR-14, AR-18, UX-DR2, UX-DR3.

**Files:**

- `src/components/error-page/card-styles.ts` (new): class `ErrorPageCardStyles` in the AD§14.1
  shape, tokens card, title, description and the breakpoint-independent `statusCode` (the
  visually hidden object `UILiveStatus` uses: absolute, 1 x 1 px, `clip: rect(0 0 0 0)`,
  `overflow: hidden`, no wrap): Golos pinned, text sizes in `rem` (AD§9.1), card
  padding `top − border` / `bottom − border` with `box-sizing: border-box`, the title and the
  description centred with no width but `max-width: calc(100% - 2 × textInset)` (48 / 48 / 32
  px, AD§8.2), and the title's `'&:focus': { outline: 'none' }` (AD§12).
- `src/components/error-page/digit-styles.ts` (new): class `ErrorPageDigitStyles`, tokens digits
  (frame, Golos 700, `text-shadow: 0 <offset>px 0 <shadow>`) and glyphs (the three absolute
  `:nth-of-type` positions of one breakpoint per fragment). No generated content.
- `src/components/error-page/error-page-digits.tsx` (new): one `Box id={ERROR_PAGE_DIGITS_ID}`
  with `aria-hidden="true"` holding three `<span>` elements whose text is the glyph, coloured
  from the variant.
- `tests/utils/a11y/axe-config.ts`: the second appended `A11Y_EXCEPTIONS` entry (AD§10.4), rule
  `color-contrast`, selector `#error-page-digits > span`, reason citing `#1EAEFF` / `#FFC01E`
  on `#FBFBFB` at 2.37:1 / 1.58:1, `trackingUrl: PALETTE_CONTRAST_ISSUE` (#276).
- `src/components/error-page/error-page-card.tsx` (new): `Box component="h1"
id={ERROR_PAGE_TITLE_ID} tabIndex={-1}` focused through `useFocusOnMount`, a plain `p`
  visually hidden `p` with `t(config.codeKey)` (the status code, WCAG 1.3.1, AD§8.4), a plain
  `p` description, then `ErrorPageActions`. The `h1` is a programmatic focus target only and
  shows no outline (AD§12); the focus rings belong to the buttons.

**Tests (new):**

- `tests/unit/components/error-page/card-styles.test.ts`: isolated load, `toEqual` on every
  token for the three breakpoints (title 600 2.25rem / 2.6875rem desktop, 700 1.375rem /
  1.625rem mobile; description 1rem / 1.625rem, 1.125rem / 1.875rem, 0.9375rem / 1.5625rem;
  card shadows and radii; the title and description `maxWidth` 48 / 48 / 32 px insets; the
  title's `'&:focus': { outline: 'none' }`; the `statusCode` visually hidden object).
- `tests/unit/components/error-page/digit-styles.test.ts`: isolated load, `toEqual` on every
  token (digits 244.5px / 293.4px and 154.462px / 185.355px; glyph tops 0 / 36 / 0 and
  14.582 / 37.324 / 14.582).
- `tests/unit/components/error-page/error-page-digits.test.tsx`: `#error-page-digits` holds
  three spans with text 4/0/4, 4/0/3, 5/x/x; the box is `aria-hidden`, so no digit is exposed by
  role.
- `tests/unit/a11y/a11y-gate.test.tsx`: passes unedited (validates the second entry's fields).
- `tests/unit/components/error-page/error-page-card.test.tsx`: `h1#error-page-title` has focus
  after mount; uk strings per variant; en strings after `changeLanguage` without a reload; the
  uk 403 description contains "На жаль," and not "Нажаль"; the description has no
  `role="alert"` and is not a live region; `getByText('Код помилки: 403')` (and the 404 / 5xx
  and en twins) finds exactly one element, the `p` that follows the `h1`.

**Verification (local-light):** focused Jest on the four tests; ESLint, Prettier,
`make lint-tsc`; `make lint-metrics`, `make lint-dup`.

**Verification (CI-only):** `unit testing / unit`; `mutation testing / merge and enforce gate`;
`accessibility testing / axe component gate`.

Dependency: depends on Story 1.2, Story 2.2

**Acceptance Criteria:**

- **Given** each variant at 1440, **When** the digits render, **Then** they are Golos 700
  244.5 px with line height 293.4 px, glyph boxes at x 0 / 147 / 301 in a 466 x 330 frame,
  the middle glyph 36 px lower, the row left-aligned, fill and shadow per variant.
- **Given** the 375 composition, **When** the digits render, **Then** they are Golos 700
  154.462 px with line height 185.355 px in a 344.435 x 243.913 frame, glyph boxes at
  (27.739, 14.582), (120.606, 37.324) and (217.896, 14.582), shadow offset 2.527 px.
- **Given** the digits, **When** a screen reader reads the page, **Then** the glyph spans sit
  inside the `aria-hidden` box and are not exposed, **And** the status code is announced once,
  from the visually hidden "Код помилки: 404 / 403 / 5xx" line after the `h1`, which changes no
  pixel (WCAG 1.3.1); **When** the route axe lane scans it,
  **Then** the 404 (2.37:1) and 5xx (1.58:1) glyph spans are reported only as
  `#error-page-digits > span` nodes that the new scoped entry removes, and no other node of
  `color-contrast` is hidden (AD§8.4, §10.4).
- **Given** the card at 1440, 1024 and 375, **When** it renders, **Then** its box, border,
  radius, shadow and rhythm equal FR-12, FR-13 and FR-14 (heights 222, 235 and 173.696), **And**
  its height is content-driven so longer copy grows it downward (1.4.12 spacing is proved in the
  browser by Story 3.3's text-spacing spec; jsdom cannot lay out).
- **Given** the title and description styles, **When** they are loaded, **Then** each carries
  `max-width: calc(100% - 48px)` on desktop and tablet and `calc(100% - 32px)` on mobile, and
  the actions row carries none (AD§8.2).
- **Given** a mount or a keyed remount, **When** the card appears, **Then** focus is on the
  only `h1`, and no positive `tabindex` exists.
- **Given** the `h1` focused programmatically, **When** its style is read, **Then** `:focus`
  carries `outline: none`, **And** no rule removes the buttons' `:focus-visible` rings.
- **Given** the text colours, **When** computed styles are read, **Then** the title is
  `#000000` and the description `#1A1C1E`, both from tokens.

Commit group: A.

### Story 2.4: Compose `ErrorPage` with its landmark, title and footer

As a user,
I want each error page to be one landmark with a tab title and the footer once,
So that assistive technology and the browser tab name the page and nothing repeats.

**Requirements:** FR-1, FR-10, FR-11 (landmarks, `lang`), FR-15, FR-16, NFR-9, NFR-13, AR-1,
UX-DR1, UX-DR7.

**Files:**

- `src/components/error-page/styles.ts` (new): class `ErrorPageStyles` in the AD§14.1 shape,
  tokens landmark (`#FBFBFB`, top and bottom padding, `overflow-x: clip`, flex column that grows
  to push the footer down) and composition (width, `max-width`, centring, mobile
  `padding-bottom`).
- `src/components/error-page/error-page-composition.tsx` (new): the positioned 614 / 474 /
  350.348 px box (`position: relative; isolation: isolate`, flex column centred) holding
  `ErrorPageIllustration`, `ErrorPageDigits` and `ErrorPageCard`, with the mobile
  `padding-bottom: 78.87px` and `max-width: calc(100% - 24.6px)`.
- `src/components/error-page/index.tsx` (new): default-exported `ErrorPage({ variant,
landmark })`: `usePageTitle(config.titleKey)`, `Box component` `main` or `section` with
  `aria-labelledby` (via a conditional spread or a widened local type, never a cast), `lang`
  from `i18n.resolvedLanguage`, the `#FBFBFB` background, top padding 76 / 76 / 43.61 and bottom
  121 / 121 / 73.91, then `UIFooter` only when `landmark === 'main'` (`cond ? <X /> : null`).
- `tests/unit/a11y/ui-components.a11y.test.tsx`: the old `<NotFound />` case is replaced by
  `ErrorPage` in all three variants (`main`) plus `forbidden` in `region` mode, SVGs mocked.

**Tests (new):**

- `tests/unit/components/error-page/error-page.test.tsx`: `main` versus
  `section[aria-labelledby="error-page-title"]`; `lang`; `getAllByRole('contentinfo')` length 1
  in `main` mode and 0 from the page in `region` mode; `usePageTitle` called with each variant's
  key; one `h1`; no `role="alert"`; the title "<title> - VilnaCRM" is applied and reset to
  "VilnaCRM" on unmount.
- `tests/unit/components/error-page/error-page-composition.test.tsx`: illustration, digits and
  card render in that order for each variant.
- `tests/unit/components/error-page/styles.test.ts`: isolated load, `toEqual` on both tokens for
  the three breakpoints.

**Verification (local-light):** focused Jest on the two new tests and the jest-axe test; ESLint,
Prettier, `make lint-tsc`; `make lint-metrics`, `make lint-dup`, `make lint-deps` (expect
`ErrorPage` to be an orphan until Story 3.1; the group A commit point is after 3.1).

**Verification (CI-only):** `unit testing / unit`; `accessibility testing / axe component gate`;
`mutation testing / merge and enforce gate`.

Dependency: depends on Story 2.1, Story 2.3

**Acceptance Criteria:**

- **Given** `landmark="main"`, **When** the page renders, **Then** it is the only `main`, it
  carries `lang`, and it renders `UIFooter` once below the content, full width.
- **Given** `landmark="region"`, **When** the page renders, **Then** it is a `section` named by
  the `h1` text and renders no footer.
- **Given** jest-axe, **When** the three variants and the region mode are scanned, **Then** 0
  violations are reported.
- **Given** the style tokens, **When** they are loaded, **Then** the composition has a fixed
  614 px width centred by auto margins, the landmark clips `overflow-x`, grows to fill the space
  above the footer and keeps bottom padding 121 / 121 / 73.91 px. jsdom cannot measure layout,
  so the 1920 centring and both footer placements are proved in the browser by Story 3.2's E2E
  (FR-12 E1, FR-15 E1 and E2).
- **Given** the eager graph, **When** `performance-serving.test.ts` walks it, **Then** no file
  under `src/components/error-page/` is reachable statically from `src/index.tsx`.
- **Given** unmount, **When** the page is removed, **Then** no listener or timer remains (the
  title hook cleans up), so the memlab away page stays leak-free.

Commit group: A.

## Epic 3: Users reach the 404, 403 and 5xx pages by URL

The catch-all route shows the new 404, and two new public routes show the 403 and 5xx pages
directly, so E2E, visual and a11y lanes and RBAC (#114) can address them. Covers FR-2 to FR-5,
FR-7, FR-8, FR-10, FR-11, FR-17, NFR-5, NFR-6, NFR-9, AR-11, AR-12.

### Story 3.1: Render the designed 404 page on the catch-all route

As a user who opens an unknown URL,
I want the designed 404 page with one way home,
So that a dead link looks like the product and gets me back in one action.

**Requirements:** FR-2, FR-9, FR-17 (404 part), NFR-5, NFR-13, NFR-14, AR-12.

**Files:**

- `src/components/not-found/not-found.tsx`: reworked in place to
  `<ErrorPage variant="notFound" landmark="main" />`; `UIBackToMain`, the `h4`-styled heading,
  the text button and the static `UIFooter` import are removed.
- `src/components/not-found/i18n/` deleted (`not_found.*`); `src/i18n/localization.json`
  regenerated.
- `tests/unit/components/not-found/not-found.test.tsx`: reworked to mock
  `@/components/error-page` and assert `variant="notFound"` and `landmark="main"`.
- `tests/e2e/modules/not-found.spec.ts`: rewritten (AD§15.4) with `test` from
  `@tests/e2e/utils/fixtures`.
- `tests/visual/constants.ts`: `notFoundScreens` becomes `desktop` 1440 x 1000, `tablet`
  1024 x 1366, `mobile` 375 x 1082, and the existing comment at lines 99 to 101 ("a static,
  text-only page, so a desktop/mobile pair is enough") is amended so it stays true (amending an
  existing comment is not an added comment).
- `tests/e2e/route-coverage.tsv`: the `notFound` visual row's details text ("Desktop and
  mobile") is updated to the three screens.
- `tests/visual/visual-comparison.not-found.spec.ts`: loops the redefined screens (baselines are
  produced in the pull-request stage, never locally).

**Tests:** the reworked unit test; `tests/unit/routes/routes.test.tsx` ("renders NotFound on
unknown path") and the `not-found` pin in `tests/unit/tooling/performance-serving.test.ts`
pass unedited; the E2E spec covers `/definitely-not-a-route`, the deep path `/a/b/c?x=1#y` and
`/__memlab_away__`.

**Verification (local-light):** `make i18n-generate`, `make lint-i18n`; focused Jest on the
not-found, routes, performance-serving and jest-axe tests; ESLint, Prettier, `make lint-tsc`;
`make lint-deps`, `make lint-dup`, `make lint-metrics`; then the group A commit (`HUSKY=0`,
explicit staging, manual commitlint, per Story Conventions).

**Verification (CI-only):** `unit testing / unit`; `e2e testing / test`;
`visual tests / visual-test`; `memory leak testing / memory-leak-testing`;
`static testing / static`; `bundle size / measure and gate`.

Dependency: depends on Story 2.4

**Acceptance Criteria:**

- **Given** `app-routes.ts`, **When** it is read, **Then** the catch-all still loads
  `@/components/not-found/not-found` with `webpackChunkName: "not-found"` and `guard: 'public'`,
  unedited.
- **Given** `/definitely-not-a-route` and `/a/b/c?x=1#y`, **When** they open, **Then** `main h1`
  equals `t('error_page.not_found.title')`, the description is shown, exactly one
  `main a[href="/"]` named `t('error_page.actions.home')` exists, the `h1` is focused and the
  tab title is "Помилка 404 - VilnaCRM".
- **Given** the home link, **When** it is clicked, **Then** the browser lands on `/` and then
  the existing auth redirect applies.
- **Given** `/__memlab_away__`, **When** it opens, **Then** the 404 page renders with zero
  console output.
- **Given** the repository, **When** it is searched, **Then** no `not_found.` key reference
  remains in `src/` or `tests/`, **And** `make lint-i18n` passes.
- **Given** the not-found page, **When** it renders, **Then** it has no back-to-main link and no
  `button` element.

Commit group: A (commit point: the end of this story).

### Story 3.2: Add the `/forbidden` and `/server-error` routes

As a user who is denied a page or hits a server failure, and as an RBAC developer,
I want stable public URLs that show the designed 403 and 5xx pages,
So that guards can redirect there and every browser lane can reach them.

**Requirements:** FR-3, FR-4, FR-5, FR-7, FR-8, FR-10, FR-13 (E1, E2), FR-14 (320 and 375 px),
FR-17, NFR-5, NFR-7 (1.4.10), NFR-9, AR-11, AR-18.

**Files:**

- `src/routes/route-paths.ts`: `forbidden: '/forbidden'` and `serverError: '/server-error'`
  before `notFound`; existing keys unchanged; no comment added.
- `src/routes/app-routes.ts`: two `guard: 'public'` entries before the catch-all, lazy
  `import()`s named `forbidden` and `server-error` (AD§11.2 shape).
- `src/components/forbidden/forbidden.tsx`, `src/components/server-error/server-error.tsx`
  (new): `<ErrorPage variant="forbidden" landmark="main" />` and the `serverError` twin.
- `tests/unit/components/forbidden/forbidden.test.tsx`,
  `tests/unit/components/server-error/server-error.test.tsx` (new): mock
  `@/components/error-page`, assert `variant` and `landmark="main"`.
- `tests/unit/routes/route-paths.test.ts`, `registry.test.ts`, `routes.test.tsx`: new values;
  both routes public in `app.shell`; `/forbidden` and `/server-error` render their mocked page
  modules; neither is wrapped in `ProtectedRoute`.
- `tests/unit/routes/route-composer.test.tsx`: the "keeps public routes directly under
  RootLayout" `toEqual` becomes `[ROUTE_PATHS.forbidden, ROUTE_PATHS.serverError,
ROUTE_PATHS.notFound, ROUTE_PATHS.signUp, ROUTE_PATHS.signIn]` (today it pins the three
  existing paths at lines 78 to 82 and would go red).
- `tests/unit/app.test.tsx`, `app-root.test.tsx`, `app.router-wiring.test.tsx`: mocks for the
  two new page module paths where those files mock every page.
- `tests/unit/tooling/performance-serving.test.ts`: pins the `forbidden` and `server-error`
  `webpackChunkName` imports; keeps the `not-found` pin.
- `tests/e2e/modules/error-pages.spec.ts` (new): AD§15.4 cases.
- `tests/e2e/a11y/routes.a11y.spec.ts`: `routeScans` gains `forbidden` and `serverError`
  (`ready: 'main h1'`, no `seedAuth`).
- `tests/visual/constants.ts`: `PAGES.FORBIDDEN`, `PAGES.SERVER_ERROR`, a 1440 x 940 screen set
  and a 1024 x 1366 screen for 403; `tests/visual/visual-comparison.error-pages.spec.ts` (new)
  with the screen names `forbidden-desktop`, `forbidden-tablet` (regression only, no parity
  claim) and `server-error-desktop`.
- `tests/e2e/route-coverage.tsv`: e2e, visual and a11y rows for `forbidden` and `serverError`
  (AD§11.3), no `allowlisted` row.

**Verification (local-light):** focused Jest on every touched unit test, including
`route-composer.test.tsx`, plus `tests/unit/routes/` as a whole (it is small and catches route
counts the story does not edit); `make check-e2e-route-coverage`; ESLint (including the
Playwright specs), Prettier, `make lint-tsc`; `make lint-deps`, `make lint-dup`.

**Verification (CI-only):** `unit testing / unit`; `e2e testing / test` (route-coverage step
first); `accessibility testing / axe route scans and keyboard contract`;
`visual tests / visual-test`; `bats testing / bats`; `mutation testing / merge and enforce
gate`; `bundle size / measure and gate`.

Dependency: depends on Story 3.1

**Acceptance Criteria:**

- **Given** `/forbidden` without and with a seeded auth token, **When** it opens, **Then** the
  403 `h1` "В доступі відмовлено", the outlined home link, then "Запросити доступ" and the
  footer render with no redirect, **And** the tab title is "В доступі відмовлено - VilnaCRM".
- **Given** "Запросити доступ", **When** it is clicked and activated with Enter and Space,
  **Then** it carries `aria-disabled="true"`, **And** the URL, the `h1` and the request log are
  unchanged, with zero console output.
- **Given** `/server-error`, **When** it opens, **Then** the 5xx `h1` "Помилка сервера", one
  `a[href="/"]` and the footer render, **And** the page has no `button`.
- **Given** "На головну" on `/forbidden` and on `/server-error`, **When** it is clicked, **Then**
  the browser lands on `/` or its auth redirect (FR-7 P1).
- **Given** a reload on either route, **When** the page reloads, **Then** it renders the same
  page; `/forbidden/` and `/Forbidden` behave as React Router matches them, pinned by the spec.
- **Given** a 320 x 640 viewport, **When** the 404, 403 and 5xx pages open (uk, the build
  language of every browser lane), **Then** `document.documentElement.scrollWidth` equals the
  viewport width, **And** each glyph span of `#error-page-digits` and the card's box lie within
  x 0 to 320, **And** the uk 403 and 5xx descriptions wrap inside a taller card, keep at least
  16 px from each card edge and leave the actions inside the card, **And** the yellow tab's box
  lies within the card's left and right edges (reached by DOM order from `main h1`).
- **Given** a 375 x 812 viewport, **When** `/forbidden` and `/server-error` open, **Then** the
  uk description keeps at least 16 px from each card edge.
- **Given** a 1024 x 1366 viewport (uk), **When** `/forbidden` opens, **Then** both actions
  share one top and lie inside the 474 px card, **And** the description keeps at least 24 px
  from each card edge. The en row and en wrapping are checked in Story 6.1's en pass, because
  `src/i18n.js` fixes the language at build time and no browser lane renders en.
- **Given** a 1440 x 600 viewport, **When** each page opens, **Then** the footer top is at or
  below the lowest decoration's bottom plus 121 px and nothing overlaps; **Given** 1440 x 1400,
  **Then** the footer's bottom edge is at the viewport bottom ± 1 px (FR-15 E1, E2).
- **Given** a 1920 x 1080 viewport, **When** each page opens, **Then** the card is 614 px wide
  and centred at 960 ± 1 px (FR-12 E1).
- **Given** the open-route landmark case of `route-composer.test.tsx`, **When** it runs, **Then**
  both new routes report `main`.
- **Given** the route lane, **When** it scans both routes in chromium, firefox and webkit,
  **Then** it finds `contentinfo` and reports 0 violations apart from the Story 2.2 and 2.3
  entries.
- **Given** `make check-e2e-route-coverage`, **When** it runs, **Then** it passes, **And**
  removing any new row makes it fail.
- **Given** `registry.ts`, `route-composer.tsx`, `routes.tsx` and `route-validator.ts`, **When**
  the diff is inspected, **Then** none changed, so the ADR-drift gate is not triggered.

> Out of scope, tracked follow-up (repeated from Story 2.2): the access-request flow behind
> "Запросити доступ" belongs to RBAC #114; the PR body lists it under "Follow-ups".
>
> Assumption (AD§11.2, RK-9): RBAC PR #230 adds `accessDenied: '/access-denied'` to the same
> file; whichever PR merges second rebases onto `ROUTE_PATHS.forbidden`. No alias is added here.

Commit group: C.

### Story 3.3: Pin the keyboard contract and text spacing of the 403 page

As a keyboard-only user, or a user who overrides text spacing,
I want Tab to move from the home link to "Запросити доступ" and then to the footer, with a
visible focus ring, and the card to keep all its text and actions when spacing grows,
So that I can operate and read the 403 page without a mouse or the default spacing.

**Requirements:** FR-7 (P2), FR-11 (E1), NFR-7 (2.4.7, 1.4.12), NFR-9.

**Files:**

- `tests/e2e/a11y/error-pages-keyboard.a11y.spec.ts` (new): `expectTabOrder` on `/forbidden`
  over the outlined home link, "Запросити доступ" and both footer links, every stop declared
  `visibleFocus: true` (precedent `home-keyboard.a11y.spec.ts`; required by
  `docs/accessibility/acceptance-standard.md` for static focus styles), so a page that draws no
  ring fails; a single-stop `expectTabOrder` with `visibleFocus: true` on the contained home
  link of the catch-all and `/server-error`; Enter on the home link navigates to `/`; right
  after `page.goto` on the catch-all, `/forbidden` and `/server-error` the `h1` is
  `document.activeElement` with computed `outline-style: none`; at 839 x 412 (landscape
  Pixel 7) the focused `h1` lies fully inside the viewport (AD§12 short-viewport decision).
- `tests/e2e/a11y/error-pages-text-spacing.a11y.spec.ts` (new): injects the WCAG 1.4.12
  override stylesheet (line height 1.5, letter spacing 0.12em, word spacing 0.16em, paragraph
  spacing 2em, all `!important`) on `/forbidden` at 1440 x 940, 1024 x 1366 and 375 x 812 (uk)
  and asserts the `h1`, the description and both actions lie inside the card's box.
- `tests/e2e/route-coverage.tsv`: the `forbidden` keyboard and text-spacing rows (AD§11.3).

**Verification (local-light):** `make check-e2e-route-coverage`; ESLint and Prettier on both
specs.

**Verification (CI-only):** `accessibility testing / axe route scans and keyboard contract`;
`e2e testing / test`.

Dependency: depends on Story 3.2

**Acceptance Criteria:**

- **Given** `/forbidden`, **When** the user presses Tab from the page start, **Then** focus
  visits the home link, "Запросити доступ" and the footer links in that order, each exactly one
  Tab away and `:focus-visible`, **And** every stop is declared `visibleFocus: true`, so each
  one's computed style changes on focus (a missing ring fails, WCAG 2.4.7).
- **Given** the catch-all and `/server-error`, **When** Tab is pressed once from the page start,
  **Then** the contained home link is focused, `:focus-visible`, and its computed style changes
  (`visibleFocus: true`).
- **Given** an 839 x 412 viewport, **When** each of the three pages opens with `page.goto`,
  **Then** the `h1` is focused and its box lies fully inside the viewport (the page may open
  scrolled; accepted and flagged, AD§12).
- **Given** focus on the home link, **When** Enter is pressed, **Then** the browser navigates to
  `/`.
- **Given** a fresh `page.goto` on each of the three pages, **When** the page settles, **Then**
  the `h1` is focused and its computed `outline-style` is `none` in chromium, firefox and
  webkit, so the baselines and the Fable comparison carry no title outline (AD§12).
- **Given** the WCAG 1.4.12 overrides at 1440 x 940, 1024 x 1366 and 375 x 812, **When**
  `/forbidden` settles, **Then** the `h1`, the description and both actions lie inside the
  card's box (nothing clipped by `overflow: hidden`), the card is taller than without the
  overrides, and the actions row may wrap.
- **Given** both specs, **When** ESLint runs, **Then** no conditional, skip, fixme or wait-for-
  timeout is used.

Commit group: C.

### Story 3.4: Audit the error routes with Lighthouse

As the product owner who asked for routes "reachable by E2E/visual/Lighthouse",
I want `/forbidden` and `/server-error` in the Lighthouse runs,
So that the accessibility definition of done's second-line signal covers the new user-facing
pages.

**Requirements:** FR-17, NFR-12, NFR-21.

**Files:**

- `lighthouse/constants.js`: `pages` gains `/forbidden` and `/server-error` after `/sign-in`,
  with the same `normalizedBaseUrl` expansion as the existing entries.
- `tests/unit/tooling/lighthouse-constants.test.ts`: the pinned `pages` list (lines 25 to 31)
  gains `'http://prod:3001/forbidden'` and `'http://prod:3001/server-error'`.

**Tests:** the updated tooling test.

**Verification (local-light):** focused Jest on `lighthouse-constants.test.ts`; ESLint and
Prettier on both files.

**Verification (CI-only):** `performance testing / lighthouse desktop`,
`performance testing / lighthouse mobile`; `unit testing / unit`;
`gate ratchet / no binding threshold weakened` (the manifest lists `lighthouse/constants.js` as
a `dependsOn` of both `lighthouserc` files; adding URLs widens coverage and needs no
`gate-relaxation` label).

Dependency: depends on Story 3.2

**Acceptance Criteria:**

- **Given** `lighthouse/constants.js`, **When** the tooling test loads it, **Then** `pages`
  equals the five expanded URLs in order `/`, `/sign-up`, `/sign-in`, `/forbidden`,
  `/server-error`.
- **Given** the CI Lighthouse runs, **When** they audit the two error routes, **Then** they pass
  the existing `lighthouserc` assertions (desktop: performance, accessibility and best
  practices 0.95, SEO 0.90; mobile: performance 0.84 `median-run`, accessibility, best
  practices and SEO 0.90) and the resource-summary budgets; a green job proves only these.
- **Given** the LHCI report of the mobile job, **When** the PR body is written, **Then** it
  records the two error routes' mobile category scores and states whether each reaches the
  profile's `quality.lighthouse_mobile` 85; the three existing URLs are not re-scored by this
  story.
- **Given** an error route that misses a floor, **When** that is found, **Then** the PR raises
  it to the product owner as an explicit question; no floor, budget or `lighthouserc` value is
  changed and the URL is not removed.
- **Given** `config/performance-budget.json`, the `lighthouserc` files and
  `config/gate-thresholds.manifest.json`, **When** the diff is inspected, **Then** none changed.

Commit group: C (commit point: the end of Stories 3.3 and 3.4).

## Epic 4: A route error response with a known status shows the designed page

`RouteError` stays eager and MUI-free: a tiny detector decides between the lazy, themed status
page and today's `ErrorFallback`. Covers FR-6, FR-16 (region mode), NFR-10, NFR-11, NFR-19,
AR-3 to AR-6.

### Story 4.1: Add `ErrorPageStatusDetector`

As the route-error dispatcher,
I want one eager, MUI-free class that maps a route error to a page variant or to nothing,
So that only 403, 404 and 500 to 599 responses leave the existing recovery screen.

**Requirements:** FR-6 (mapping), NFR-16, AR-4.

**Files:**

- `src/components/error-boundary/error-page-status-detector.ts` (new): class
  `ErrorPageStatusDetector` (AD§5.2): `detect(routeError)` reads a status from a router error
  response (`isRouteErrorResponse`), a thrown `Response` (`instanceof Response`) or a `data()`
  value (`type === 'DataWithResponseInit'`, numeric `init.status`), then returns `serverError`
  for 500 to 599, the exact map for 403 and 404, else `null`; `null` when no status is found.
  Narrowing uses `typeof` and `in`, never a cast; exported as a singleton. Imports only
  `react-router` and a type.

**Tests:** `tests/unit/components/error-boundary/error-page-status-detector.test.ts` (new): the
AD§5.2 matrix over three input shapes: the router-shaped literal
`{ status, statusText: '', internal: false, data: null }` (precedent `buildRouteResponse` in
`tests/unit/lib/reliability/recovery-strategy-detector.test.ts`), `new Response(null, { status })`
and `data(null, status)` / `data(null, { status })`. 403, 404, 500, 503 and 599 return the
variant; 399, 400, 401, 405, 499 and 600 return `null` (600 only as a router literal and
`data()`, since the `Response` constructor rejects it); `data(null)`, a `DataWithResponseInit`
object without a numeric `init.status`, an object with another `type`, a plain `{ status: 404 }`,
`new Error('boom')`, a chunk-load error, `null`, `undefined`, a string and a number return
`null`.

**Verification (local-light):** focused Jest on the test; ESLint, Prettier, `make lint-tsc`.

**Verification (CI-only):** `unit testing / unit`; `mutation testing / merge and enforce gate`.

Dependency: depends on Story 1.2

**Acceptance Criteria:**

- **Given** the boundary statuses 499, 500, 599 and 600, **When** `detect` runs, **Then** only
  500 and 599 map to `serverError`, so every `EqualityOperator` and `ConditionalExpression`
  mutant is killed.
- **Given** a raw `new Response(null, { status: 403 })` and a raw `data(null, { status: 403 })`,
  **When** `detect` runs, **Then** both return `forbidden`, **And** `data(null)` returns `null`.
- **Given** the class, **When** ESLint runs, **Then** its `*Detector` suffix and instance-method
  shape pass the #100 and #129 gates with no policy edit.
- **Given** `recoveryStrategyDetector`, **When** the diff is inspected, **Then** it is unchanged.

Commit group: B.

### Story 4.2: Dispatch status errors from `RouteError` to the lazy, themed page

As a user whose route throws a 403, 404 or 5xx response,
I want the designed page for that status instead of the generic recovery screen,
So that a denied or failed route looks like the product, while other crashes keep today's
recovery options.

**Requirements:** FR-6, FR-16 (region mode), NFR-10, NFR-11, NFR-13, NFR-19, AR-3, AR-5.

**Files:**

- `src/components/error-boundary/route-error-fallback.tsx` (new): today's `RouteError` body
  moved verbatim (its `toError`, `reloadPage`, `focusMainWhenFocusWasLost` helpers and the
  `ErrorFallback` keyed by `location.key`).
- `src/components/error-boundary/route-error.tsx`: rewritten as the dispatcher of AD§5.1.
- `src/components/error-boundary/route-error-page.tsx` (new): module-level `lazy` over
  `errorPageLoader.load()` with a `.catch` that resolves `ErrorPageUnavailable` (renders
  `RouteErrorFallback`), inside `<Suspense fallback={<RouteFallback />}>`, keyed by
  `location.key`.
- `src/components/error-boundary/error-page-loader.ts` (new): the `errorPageLoader` instance of
  AD§6.3 (`ThemedChunkLoader<ErrorPageProps>` over `ChunkRetryLoader` of
  `import(/* webpackChunkName: "error-page" */ '@/components/error-page')`, `muiThemeShellLoader`).

**Tests:**

- `tests/unit/components/error-boundary/route-error.test.tsx`: rewritten as the dispatcher test;
  the two old cases "404 → navigate-home" and "503 → in-place retry" are rewritten to the new
  behaviour, not deleted.
- `tests/unit/components/error-boundary/route-error-fallback.test.tsx` (new): the existing
  `RouteError` cases moved over (navigate-home for 401, retry for `{ retryable }`, reset,
  region versus main, remount on key).
- `tests/unit/components/error-boundary/route-error-page.test.tsx` (new): mocks
  `@/components/error-page` with a stub that echoes `variant` and `landmark` in an `h1`;
  `RouteFallback` while pending; the stub after `findByRole('heading', { level: 1 })`; a
  rejected loader renders `ErrorFallback` for the original error; remount on `location.key`.
  The module-level `lazy` caches its first resolution, so the success and rejected-loader
  cases each load the module fresh (`jest.isolateModulesAsync`, or `jest.resetModules()` plus
  `import()`).
- `tests/unit/components/error-boundary/error-page-loader.test.ts` (new): resolves a themed
  component that forwards `variant` and `landmark` (page and shell mocked).
- `tests/unit/components/error-boundary/route-error.router.test.tsx`: renders the real page, so
  it `jest.mock`s the five SVG modules (the four `src/assets/illustrations/error-page/*.svg`
  and `@/assets/icons/logo/vilna-logo.svg` from `UIFooter`); without them the lazy import
  rejects and the test silently renders `ErrorFallback`. `createMemoryRouter` routes whose
  **page component throws during render** (the only throw path the route contract has)
  `data(null, { status })` and `new Response(null, { status })` for 400, 401, 403, 404, 499,
  500 and 599, `data(null, 600)` and a plain `Error`; the same statuses thrown from loaders
  (router-converted, for future loaders); each status page is asserted by its `error_page.*`
  title through `findByRole('heading', { level: 1 })`; under a stand-in `AppLayout`: `region`, one `main`,
  one `contentinfo`; the existing `onRouteError` seam still receives the 404 with
  `surface: 'route'` while the 404 page renders; `onCaughtError` passed and asserted per test.
- `tests/unit/tooling/performance-serving.test.ts`: asserts `error-page-loader.ts` imports
  `@/components/error-page` dynamically with `webpackChunkName: "error-page"`; the eager-MUI
  walk is unchanged.
- `tests/integration/services/security-events/security-event-chain.integration.test.ts`: one
  service-seam case (AD§15.2): report `new Error('404 Not Found')` through `boundaryErrorReporter`
  with `{ surface: 'route' }` and assert the `error_boundary_catch` event with surface `route`
  and the observability capture. No React, router or page module is imported: the integration
  run applies global 100 % coverage to every `src` file it loads, so rendering the page there
  would turn `integration testing / integration` red.

**Verification (local-light):** focused Jest on every touched unit test; ESLint, Prettier,
`make lint-tsc`; `make lint-deps`, `make lint-metrics`, `make lint-dup`; then the group B
commit.

**Verification (CI-only):** `unit testing / unit`; `integration testing / integration`;
`mutation testing / merge and enforce gate`; `bundle size / measure and gate`;
`static testing / static`.

Dependency: depends on Story 1.3, Story 2.4, Story 4.1

**Acceptance Criteria:**

- **Given** page components that throw `data()` or `Response` values with status 403, 404, 500
  and 599 during render, and loaders throwing the same, **When** the router renders the
  `errorElement`, **Then** the matching page appears after the lazy load, with its `h1` focused.
- **Given** a page that throws a 401 `Response` during render, **When** the router renders the
  `errorElement`, **Then** `ErrorFallback` renders with Try again (strategy `reset`), as today.
- **Given** 400, 401, 405, 499, 600, a plain `Error`, a chunk-load error and a `{ retryable }`
  error, **When** the router renders the `errorElement`, **Then** `ErrorFallback` renders
  exactly as today (navigate-home, Try again or Reload where it applies).
- **Given** an error-page chunk that fails after its retry, **When** a status error renders,
  **Then** `ErrorFallback` renders for the original error, with no blank screen and no
  unhandled rejection.
- **Given** a protected page under `AppLayout` that throws a 404 response, **When** it renders,
  **Then** the page is a `section` named by its `h1`, the document has one `main` and one
  `contentinfo`.
- **Given** `routeComposer.routeErrorHandler()`, **When** a status error occurs, **Then** it is
  still reported once with `surface: 'route'`, **And** the page shows no status text, message
  or stack.
- **Given** the eager graph, **When** `performance-serving.test.ts` walks it, **Then** the only
  `@mui/*` edge is still `app-providers.tsx`, **And** the CI bundle comment shows an eager gzip
  delta of at most 2,048 B with `config/performance-budget.json` unedited.
- **Given** `route-composer.tsx` and `route-mapper.tsx`, **When** the diff is inspected,
  **Then** they still import `RouteError` from the same path and are unedited.

Commit group: B (commit point: the end of this story).

## Epic 5: Reviewers and contributors find the decision and the new routes documented

The reliability change is recorded as ADR-018, and every doc that names the 404 page, the route
table, the a11y exceptions or the error-boundary behaviour is synced. Covers FR-18, AR-13.

### Story 5.1: Record ADR-018 for route error status pages

As the maintainer,
I want the loss of the in-place retry for 5xx route responses recorded as a decision,
So that ADR-007 stays intact and the change is reviewable.

**Requirements:** FR-18, AR-13.

**Files:**

- `docs/adr/018-route-error-status-pages.md` (new): the AD§16.2 outline filled into every
  template section in the template's exact shape (`#### Good (Option X)` / `#### Bad (Option X)`
  headings with bullet bodies; the outline is a content guide, not text to paste unchecked), `Status: Approved`, `Deciders: [@kravalg](https://github.com/kravalg)`,
  `Date: 2026-10-01`, Technical Story #309; considered options A (chosen), B and C with their
  pros and cons; consequences including the lost 5xx retry, the `ThemedChunkLoader` props
  parameter and the session-long fallback after a failed error-page chunk.
- `docs/adr/README.md`: the ADR-018 index row.
- `docs/adr/007-reliability-model.md`: one line under "Links" pointing to ADR-018; the decision
  text is not edited.

**Tests:** none (documentation).

**Verification (local-light):** `make lint-adr`, `make lint-doc-links`,
`make lint-doc-references`, `make lint-md`; Prettier on the three files.

**Verification (CI-only):** `static testing / static`.

Dependency: independent

**Acceptance Criteria:**

- **Given** ADR-018, **When** `make lint-adr` runs, **Then** it passes with every required
  section, the metadata and the index row in sync.
- **Given** the Deciders line, **When** it is read, **Then** it is exactly
  `[@kravalg](https://github.com/kravalg)`.
- **Given** ADR-007, **When** the diff is inspected, **Then** only one Links line was added.
- **Given** the ADR body, **When** it is read, **Then** it states that 403, 404 and 500 to 599
  route responses render the status pages and that a 5xx route response no longer offers an
  in-place Try again.

Commit group: D.

### Story 5.2: Sync the route, a11y and contributor docs

As a contributor or an AI agent reading the repository guidance,
I want the docs to describe the new routes, the status branch and the new a11y exception,
So that no doc still claims the old 404 layout, four exceptions or a 5xx Try again.

**Note:** pattern 14's status-dispatch sentence names all three status sources (router
response, render-thrown `Response`, `data()` value), so RBAC (#114) knows a guard may throw
`data(null, { status: 403 })` or navigate to `/forbidden`.

**Requirements:** FR-18, NFR-18.

**Files:**

- `src/routes/README.md`: the `app-routes.ts` row "home + 404" becomes "home, 404, 403, 5xx";
  "Errors and fallbacks" describes the status branch in front of `ErrorFallback`.
- `CLAUDE.md`, `AGENTS.md`, `.github/copilot-instructions.md` (where each carries the text):
  pattern 14 gains the status-dispatch sentence; the Route Registry sentence "The app shell's
  own routes (home + 404) live in `src/routes/app-routes.ts`" (CLAUDE.md:2373) becomes "home,
  404, 403 and 5xx"; the Localization example path `src/components/not-found/i18n/` becomes
  `src/components/error-page/i18n/`; the accessibility section's "four `color-contrast`
  entries" becomes six.
- `docs/accessibility/acceptance-standard.md`: "Current exceptions" counts six entries and
  describes the two error-page entries (primary actions, decorative digits) and their #276
  tracking; both Lighthouse sentences (lines 25-26 and 31-33, today "`/`, `/sign-in` and
  `/sign-up`") list `/`, `/sign-in`, `/sign-up`, `/forbidden` and `/server-error`, matching
  Story 3.4's `lighthouse/constants.js`.
- `docs/ui-toolkit.md`: the R8 row "layouts, not-found" also names `error-page` as local (no
  toolkit counterpart).
- `specs/README.md`: a `309-error-pages` row in "Current Specs".

**Tests:** none (documentation).

**Verification (local-light):** `make lint-docs`, `make lint-md`; Prettier on every touched
file; a search proving no doc still says a 5xx route response offers Try again.

**Verification (CI-only):** `static testing / static`.

Dependency: depends on Story 2.2, Story 3.3, Story 4.2, Story 5.1

**Acceptance Criteria:**

- **Given** every touched doc, **When** `make lint-docs` runs, **Then** links, anchors and
  command references resolve, **And** markdownlint MD013 (tables included) passes.
- **Given** the three agent-guidance files, **When** they are compared, **Then** they state the
  same status-dispatch rule and the same exception count.
- **Given** the docs, **When** they are searched, **Then** no sentence says a 5xx route response
  offers an in-place Try again, and none names `not_found.*` keys or the deleted
  `src/components/not-found/i18n/` folder.
- **Given** the docs, **When** they are searched, **Then** no doc still describes
  `app-routes.ts` as "home + 404" (CLAUDE.md, AGENTS.md, copilot instructions and
  `src/routes/README.md` agree).
- **Given** `docs/accessibility/acceptance-standard.md`, **When** its Lighthouse sentences are
  read, **Then** both name `/`, `/sign-in`, `/sign-up`, `/forbidden` and `/server-error`, the
  same five routes as `lighthouse/constants.js`.
- **Given** a new `make` target, **When** the docs are reviewed, **Then** none is referenced
  (none exists).

Commit group: D (commit point: the end of this story).

## Epic 6: The pages are verified pixel-perfect against Figma

### Story 6.1: Verify pixel parity per frame with a measured overlay diff (Fable review)

As the product owner,
I want a Fable-model reviewer to measure each rendered page against its Figma frame and fix every
content-area defect before the PR opens,
So that "pixel-perfect" is a measured result, not a judgement call.

**Requirements:** FR-12 to FR-15 (verification), FR-19, NFR-1 to NFR-4, UX-DR1 to UX-DR8.

**Inputs handed to the reviewer:** PRD appendix A; `error-page-geometry.ts`; the AD§8.3 derived
rules; the AD§18 intended deviations (centred composition at every width including the tablet
card, 76 / 43.61 px top offsets, footer gaps of at least 121 / 73.91 px, the 403 diamond and dot
at the 404 / 5xx relative placement, "На жаль", the 5xx copy, no header or sidebar, mobile dot
rows centred on the card axis, the tab placed by insets, no outline on the focused `h1`, rem
text at the default 16 px root, the 24 / 16 px text inset, a short landscape viewport opening
scrolled to the focused `h1`); the NFR-4 per-frame masks (dot boxes from `absoluteBoundingBox`); the PRD
appendix A.4 ink references.

**Method, per frame** (404 at 1440 x 1000, 1024 x 1366 and 375 x 1082; 403 and 5xx at
1440 x 940):

1. Render the route in chromium at device scale factor 1 and the frame size on the running app
   (`make start`, port 3000; no production build locally), wait for
   `document.fonts.status === 'loaded'` and a stable DOM.
2. Read `getBoundingClientRect()` of every appendix A element relative to the composition origin
   O, and the computed colour, opacity, shadow, font family, weight, size and line height. Read
   each text run's ink width as the width of a DOM `Range` over its text node
   (`range.selectNodeContents(el); range.getBoundingClientRect().width`) and compare it with the
   reference in PRD appendix A.4 (236, 236, 144 and 384 for the titles), never with a Figma
   fixed-width text box; runs marked n/a there are recorded as covered by NFR-1 and NFR-4. At
   375 also confirm every glyph span of `#error-page-digits` and the card lie within x 0 to 375.
3. Export the frame with the Figma MCP `get_screenshot` (file `xZ7ccrH6d4QyqLQsayFSEX`) with
   `maxDimension` equal to the frame's longer edge: 1440 for 143:12154, 172:6675 and 172:6914,
   1366 for 143:12166, 1082 for 143:12178. Assert that the returned `width` / `height` equal
   `original_width` / `original_height` and fail the run otherwise (the default 1024 scales every
   frame down). Fetch the PNG with `enableBase64Response: true`, because curl to `figma.com` is
   permission-blocked in this environment (F§8); any other path needs explicit permission.
4. Crop both images to the content-area box (the ink box of the composition's visible layers
   plus 16 px each side, aligned on O, intersected with the frame's 0 to frame-width range),
   paint the NFR-4 masks out of both (5xx: title and description line boxes across the card;
   403: description line box, the Figma diamond and dot boxes and the rendered diamond and dot
   boxes, or compare the 403 decoration layer against 143:12154; mobile: no mask, crop clipped
   to 0 to 375), then overlay them with `pixelmatch` (`threshold: 0.1`, anti-aliased pixels
   excluded) in a scratch directory outside the repository; keep the diff PNG per frame and
   record every masked rectangle in the report.
5. Calibrate once: inject a 2 px card offset through devtools (never through source) and confirm
   the report flags it.
6. **en layout pass** (no browser lane renders en: `src/i18n.js` fixes `lng` from the build-time
   `REACT_APP_MAIN_LANGUAGE`): set `REACT_APP_MAIN_LANGUAGE=en` in the local, untracked `.env`,
   restart `make start`, and record the en 403 actions row on one line inside the card at
   1024 x 1366, the en 403 and 5xx descriptions inside the text inset at 1024, 375 and 320, and
   `scrollWidth` equal to the viewport at 320; then restore the value. No parity claim (no en
   frame); no source change.

**Files:** none by default. A content-area defect is fixed in the owning `src` file (normally
`error-page-geometry.ts` or a style builder) with its direct test updated in the same change.

**Tests:** the direct tests of any file a fix touches; no new test file.

**Verification (local-light):** focused Jest, ESLint, Prettier and `make lint-tsc` on any fixed
file; the five measurement tables and diff images.

**Verification (CI-only):** `visual tests / visual-test` (baselines regenerated in the
pull-request stage after the last fix).

Dependency: depends on Story 3.3, Story 4.2, Story 5.2

**Acceptance Criteria:**

- **Given** the five frames, **When** the report is written, **Then** it covers every appendix A
  element per frame with element, breakpoint, measured value, expected value, tolerance and a
  pass or fail.
- **Given** box geometry, **When** it is measured, **Then** every box is within ±1 CSS px at
  1440 and 1024 and ±1.5 CSS px at 375 (NFR-1), **And** text line boxes and ink widths are
  within NFR-2.
- **Given** colours and type, **When** computed styles are compared, **Then** hex, opacity,
  shadow, family, weight and size match exactly (NFR-3).
- **Given** the Figma exports, **When** they are received, **Then** each one's `width` /
  `height` equal its `original_width` / `original_height`.
- **Given** the overlay diff, **When** pixelmatch counts mismatched pixels outside the recorded
  NFR-4 masks, **Then** the content-area crop is at most 1.5 % mismatched at 1440 and 1024 and
  at most 3 % at 375 (NFR-4), **And** the report lists the masks so the ratios are
  reproducible.
- **Given** the `forbidden-tablet` screen, **When** the report is written, **Then** it is listed
  as a regression baseline without a parity claim (no 403 tablet frame exists).
- **Given** the text runs, **When** ink widths are compared, **Then** only the A.4 runs with a
  reference are scored against ±2 px, and every n/a run is listed with its covering check.
- **Given** the en layout pass, **When** it runs, **Then** the en 403 row is on one line inside
  the card at 1024, the en descriptions keep the 24 / 16 px inset at 1024, 375 and 320, nothing
  scrolls horizontally at 320, and `.env` is restored afterwards.
- **Given** the calibration, **When** the seeded 2 px offset is measured, **Then** it is reported
  as a defect, and the seed is removed before the real run.
- **Given** a content-area defect, **When** it is found, **Then** it is fixed and re-measured
  until the report lists zero unresolved defects; **And** a footer deviation (the unchanged
  `UIFooter`) is recorded as a follow-up issue instead.
- **Given** the finished report, **When** the PR opens, **Then** the report (tables and diff
  ratios) is attached to the PR, and no scratch script, image or `pixelmatch` dependency is
  committed.

> Assumption: measuring against the dev server is valid for geometry, colour and type because
> layout does not depend on minification; the production build is locked afterwards by the CI
> visual baselines, which the pull-request stage regenerates from the CI artifact.

Commit group: E (only when a fix was made).

## Pull-request stage (not a story)

Runs after Story 6.1 reports zero unresolved defects.

1. Push the branch and open the PR for #309 as a draft: title `feat(#309): add the designed
404, 403 and 5xx error pages` (squash header at most 100 characters), body with
   `Closes #309`.
2. **Baselines:** delete the six old not-found baselines and add the nine new ones
   (`desktop`, `tablet`, `mobile` x three engines) plus the nine 403 and 5xx ones
   (`forbidden-desktop`, `forbidden-tablet`, `server-error-desktop` x three engines), taken from the
   `visual tests / visual-test` job artifact of this PR's head, or from the pinned Playwright
   container against a freshly recreated stack. Never from a reused (`--no-recreate`) container
   and never from the host (NFR-22, RK-10).
3. **Body content (FR-20):** items for design or maintainer confirmation: the 5xx copy; "На
   жаль" instead of "Нажаль"; white on `#1EAEFF` (2.46:1) under the scoped exception (#276);
   the outlined `#969B9D` border (2.81:1); the centred tablet card; the desktop switch above
   1024 px; the decorative digits (2.37:1, 1.58:1) under the second scoped exception (#276);
   the 24 / 16 px text inset; the lost in-place retry for 5xx route responses (ADR-018); the
   measured Lighthouse scores of `/forbidden` and `/server-error`, with the mobile scores read
   against the profile's 85 (and, if one misses a floor, the explicit product-owner question of
   Story 3.4); the Story 6.1 en layout pass results; the `h1` shown without a
   focus outline; no hover, focus or pressed designs.
4. **Follow-ups section:** the "Запросити доступ" access-request flow TODO (RBAC #114); the app
   shell (header, sidebar); 403 and 5xx tablet and mobile frames; Storybook svgr support and an
   `ErrorPage` story; any footer deviation from 6.1.
5. Attach the Fable parity report, the local verification actually run, and the statement
   that commits were taken with `HUSKY=0` and a manual commitlint (Story Conventions), with CI
   as the verifier.
6. Mark the PR ready only when every NFR-21 check is green on the head (AD§17 names), with no
   re-run used to mask a flake.

## Out of Scope (carried from the PRD)

- The app shell (header with search, notifications and user menu; left sidebar).
- Any behaviour on "Запросити доступ".
- Parity claims for 403 and 5xx below 1440 px; hover, pressed and disabled designs.
- Changes to `ErrorFallback`, `UIErrorBoundary`, `AuthErrorBoundary`, `recoveryStrategyDetector`,
  `UIFooter` or the bootstrap path in `src/index.tsx`.
- Storybook stories; mobile device-lane specs; any budget, threshold or `quality.*` change;
  ui-toolkit adoption of the error boundary, footer or button.

## Final Validation

- **FR coverage:** every FR-1 to FR-20 and NFR-1 to NFR-22 maps to at least one story or the
  pull-request stage (FR Coverage Map).
- **Architecture coverage:** every file of AD§3.2 is created or edited by exactly one story;
  D-1 to D-13 each bind at least one story (AR-1 to AR-13).
- **Dependencies:** every dependency points backwards in the dispatch order; no story depends on
  a later one; independent stories (1.1, 1.3, 5.1) need nothing from another story; Story 3.4
  depends only on 3.2.
- **Commit safety:** every commit group ends in a story whose completion leaves no
  dependency-cruiser orphan, so the tree CI lints at each group head can be green.
- **Binding decisions:** UD-1 to UD-10 are honoured: wiring (3.1, 3.2, 4.2), inert request access
  with the TODO outside code (2.2, 3.2, PR stage), binding copy (1.1), content area plus footer
  only (2.4, 6.1), Fable verification before the PR (6.1).
- **Pixel and docs stories present:** Story 6.1 is the measured overlay diff per frame; Story
  5.2 is the documentation sync (with Story 5.1 for the ADR).
