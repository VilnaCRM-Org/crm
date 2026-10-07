---
status: 'complete'
workflowType: 'implementation-readiness'
stepsCompleted:
  - 'step-01-document-discovery'
  - 'step-02-prd-analysis'
  - 'step-03-epic-coverage-validation'
  - 'step-04-ux-alignment'
  - 'step-05-epic-quality-review'
  - 'step-06-final-assessment'
iteration: 4
planIteration: '3/5'
project_name: 'crm'
date: '2026-10-01'
issue: 309
branch: 'feat/309-error-pages'
base: 'origin/main cff55203'
author: 'architect (Winston), autonomous run, implementation-readiness in Validate mode'
inputDocuments:
  - 'specs/309-error-pages/planning-artifacts/research-309-error-pages-2026-10-01.md'
  - 'specs/309-error-pages/planning-artifacts/brief-309-error-pages-2026-10-01.md'
  - 'specs/309-error-pages/planning-artifacts/prd-309-error-pages-2026-10-01.md'
  - 'specs/309-error-pages/planning-artifacts/architecture-309-error-pages-2026-10-01.md'
  - 'specs/309-error-pages/planning-artifacts/epics-309-error-pages-2026-10-01.md'
  - 'https://github.com/VilnaCRM-Org/crm/issues/309'
  - 'CLAUDE.md'
  - '.jscpd.json'
  - 'config/metrics-policy.json'
  - 'config/gate-thresholds.manifest.json'
  - 'jest.config.ts'
  - 'lighthouse/constants.js'
  - 'tests/unit/tooling/lighthouse-constants.test.ts'
  - 'tests/unit/routes/route-composer.test.tsx'
  - 'tests/unit/components/error-boundary/route-error.router.test.tsx'
  - 'tests/integration/services/security-events/security-event-chain.integration.test.ts'
  - 'src/services/error-reporting/boundary-error-reporter.ts'
  - 'src/routes/route-composer.tsx'
  - 'docs/accessibility/acceptance-standard.md'
  - 'scripts/lint-metrics.sh'
  - 'bin/rust-code-analysis-cli (main checkout)'
  - 'Figma MCP get_screenshot tool schema (maxDimension, enableBase64Response)'
  - 'Figma MCP get_metadata on 143:12154, 143:12166, 143:12178, 172:6675 (2026-10-01)'
  - 'src/i18n.js, src/config/env/raw-env.ts'
  - 'lighthouse/lighthouserc.desktop.js, lighthouse/lighthouserc.mobile.js'
  - 'src/routes/types/app-route.ts, src/routes/route-mapper.tsx'
  - 'node_modules/react-router/dist/development/chunk-OB3PAWPO.mjs (react-router 7.18.4)'
  - 'tests/utils/a11y/axe-config.ts, tests/jsdom-fetch-environment.cjs'
  - 'Figma use_figma read-only script on 2026-10-01 (absoluteBoundingBox, absoluteRenderBounds, rotation of every rotated node in 143:12154, 143:12166, 143:12178, 172:6675; 172:6928, 296:15117, 143:12205)'
  - 'tests/utils/a11y/keyboard.ts, tests/e2e/a11y/home-keyboard.a11y.spec.ts'
  - '.husky/pre-commit, src/utils/use-focus-on-mount.ts, src/components/ui-live-status/index.tsx'
---

# Implementation Readiness: 404 / 403 / 5xx error pages from Figma (#309)

**Assessor:** architect (Winston), autonomous BMAD run, `implementation-readiness` in Validate
mode, iteration 4 (plan iteration 3/5). **Date:** 2026-10-01. **Issue:**
[#309](https://github.com/VilnaCRM-Org/crm/issues/309). **Status:** complete.

Inputs: [research](./research-309-error-pages-2026-10-01.md),
[brief](./brief-309-error-pages-2026-10-01.md), [PRD](./prd-309-error-pages-2026-10-01.md),
[architecture](./architecture-309-error-pages-2026-10-01.md) and
[epics and stories](./epics-309-error-pages-2026-10-01.md), plus three local research notes that are not committed (codebase map, pixel-level Figma spec
cited "F§n", gates note) and whose findings the research artifact and PRD appendix A carry.
Branch `feat/309-error-pages`, head `cff55203`,
only `specs/309-error-pages/` untracked. No build, suite or Docker command was run; the only
tools executed were `rust-code-analysis-cli`, `jscpd` and `prettier` on scratch files and the
artifacts themselves, and (plan iteration 3) two read-only Figma `use_figma` scripts.

> Assumption: the workflow's menus and "wait for input" points are skipped. The run is
> autonomous and every step auto-proceeds; decisions are recorded as `> Assumption:` lines.
>
> Assumption: the worktree's `node_modules` is a symlink to the `250-ui-toolkit` worktree, so
> library behaviour checked there (react-router 7.18.4, svgo 3.3.5, jscpd, prettier) is the
> closest local evidence, not a re-install of this branch's lockfile.

## Iteration Log

| Iteration          | Input                                       | Result                                                                                 |
| ------------------ | ------------------------------------------- | -------------------------------------------------------------------------------------- |
| readiness 1        | First full chain                            | FAIL: 1 major (R-1), 8 minor, 6 info                                                   |
| plan iteration 1/5 | R-1 to R-9 plus 14 external review findings | Every finding verified against the repository; all 23 applied at source, none rejected |
| readiness 2        | Corrected chain                             | PASS: 0 critical, 0 major, 0 open minor; 9 info notes                                  |
| plan iteration 2/5 | 9 external review findings (F-1 to F-9)     | All 9 verified; 7 applied as proposed, 2 applied with a changed remedy, none rejected  |
| readiness 3        | Corrected chain                             | PASS: 0 critical, 0 major, 0 open minor; 10 info notes                                 |
| plan iteration 3/5 | 9 external review findings (G-1 to G-9)     | All 9 verified (Figma read-only + repository); all applied, 2 by a chosen option       |
| readiness 4 (this) | Corrected chain                             | PASS: 0 critical, 0 major, 0 open minor; 12 info notes                                 |

Plan iteration 1/5 changed: the geometry table (shared desktop/tablet sub-records, mobile glyph
tops, tab insets, no description widths), the style layout (six area classes plus a compose
helper, spike-measured), the `h1` focus decision, the integration case (service seam), the SVG
mocks of the router and route-error-page tests, the detector test inputs, the Lighthouse scope
(new Story 3.4), the `route-composer.test.tsx` update, the E2E layout checks (320, 1024 en 403,
1440 x 600 / 1400, 1920), the `forbidden-tablet` baseline, the NFR-4 export and mask method,
the ink-width method, the ADR-018 outline, the doc-sync list and the commit default.

Plan iteration 2/5 changed: the decorative digits (DOM text under a second scoped #276
exception, generated content dropped, RK-4 replaced), the status detector (also reads
render-thrown `Response` and `data()` values, since the route contract has no loaders), every
browser-lane layout criterion rewritten in uk with the en checks moved to a Story 6.1 en pass,
the Lighthouse criteria restated as the real `lighthouserc` assertions plus a recorded mobile
85 reading, PRD appendix A.4 ink references, a 24 / 24 / 16 px text inset for the title and
description, the 320 px digit and card visibility check, and the WCAG 1.4.12 text-spacing spec.

Plan iteration 3/5 changed: the dot and the mobile dot rows re-read from Figma
`absoluteBoundingBox` / `absoluteRenderBounds` instead of the rotated nodes' `x` / `y` (dot
O(569, 94), centre (574.921, 99.928); tablet O(552.225, 94); rows 19.78 px below the card, 59.09
px tall; composition `padding-bottom` 78.87, mobile footer gap 73.91; corrected 403 masks),
explicit `display: 'block'` on the non-null fragments of nullable dot tokens, `visibleFocus:
true` on every keyboard tab stop, a visually hidden status-code line for WCAG 1.3.1 (three new
catalog keys), the acceptance standard's Lighthouse URL list in the doc sync, the `HUSKY=0`
wording at the group A commit, and an accepted, tested short-viewport scroll.

## 1. Document Discovery

| Type            | File                                         | State    |
| --------------- | -------------------------------------------- | -------- |
| Research        | `research-309-error-pages-2026-10-01.md`     | complete |
| Brief           | `brief-309-error-pages-2026-10-01.md`        | complete |
| PRD             | `prd-309-error-pages-2026-10-01.md`          | complete |
| Architecture    | `architecture-309-error-pages-2026-10-01.md` | complete |
| Epics & stories | `epics-309-error-pages-2026-10-01.md`        | complete |
| UX design       | none (the five Figma frames, measured)       | n/a      |

- Every document is whole, not sharded, carries `status: 'complete'`, and links its
  predecessors by relative path. All six pass `prettier --check` with the repository config
  (re-run after plan iteration 3).
- No UX document exists by design: the frames are measured into PRD appendix A and
  architecture sections 8 to 10, and the epics restate them as UX-DR1 to UX-DR8.
- Precedence when artifacts disagree: architecture, then PRD, then epics for story mechanics,
  then brief and research. The brief and research Lighthouse notes are now marked as
  superseded where the PRD changed them.

## 2. Assessment

### 2.1 PRD Analysis

- 20 FRs and 22 NFR ids (NFR-19 has a unit and an E2E half), each with acceptance criteria,
  labelled positive / negative / edge test cases and a named verification (CI check or review).
- The issue #309 acceptance-criteria trace (AC-1 to AC-5) and the product owner decision trace
  (UD-1 to UD-10) are complete; every AC and every UD maps to at least one FR. UD-3's "reachable
  by E2E/visual/Lighthouse" is now honoured in full (NFR-12, FR-17).
- FR-12 and FR-13 headings and the section 8 breakpoint assumption now match D-8 (desktop above
  1024 px, tablet 768 to 1024 px), closing I-1.

### 2.2 Epic Coverage: every FR maps to a story and a test

| FR    | Stories                 | Primary test (file or lane)                                                    |
| ----- | ----------------------- | ------------------------------------------------------------------------------ |
| FR-1  | 1.2, 2.1, 2.3, 2.4      | `error-page-variants.test.ts` (isolated), `error-page.test.tsx`; `lint-dup`    |
| FR-2  | 3.1                     | `not-found.test.tsx`, `routes.test.tsx`, `tests/e2e/modules/not-found.spec.ts` |
| FR-3  | 3.2                     | `tests/e2e/modules/error-pages.spec.ts`, route a11y lane                       |
| FR-4  | 3.2, 2.3                | `error-pages.spec.ts` (no `button`), `error-page-digits.test.tsx` (`5 x x`)    |
| FR-5  | 3.2                     | `route-paths`, `registry`, `route-composer`, `performance-serving` tests       |
| FR-6  | 4.1, 4.2                | detector test (3 input shapes), `route-error*.test.tsx`, render-throw matrix   |
| FR-7  | 2.2, 3.1, 3.2, 3.3      | `error-page-actions.test.tsx`; home clicks on all three routes; keyboard spec  |
| FR-8  | 2.2, 3.2                | `error-page-actions.test.tsx`, `error-pages.spec.ts` (click, Enter, Space)     |
| FR-9  | 1.1, 2.3, 3.1           | `lint-i18n`, `error-page-card.test.tsx` (uk, en, "На жаль,")                   |
| FR-10 | 2.4, 3.1, 3.2           | `error-page.test.tsx` (title set and reset), E2E tab-title assertions          |
| FR-11 | 2.2, 2.3, 2.4, 3.3      | card, digits tests; jest-axe; keyboard and text-spacing specs                  |
| FR-12 | 1.2, 2.x, 3.2, 6.1      | style tests (isolated), 1440 baselines, 1920 E2E centring, Fable report        |
| FR-13 | 1.2, 2.x, 3.2, 6.1      | style tests, `forbidden-tablet`, uk 403 row and inset E2E, Fable en pass       |
| FR-14 | 1.2, 2.x, 3.2, 6.1      | glyph tops, 375 baseline, 320 px glyph/card/tab/inset E2E, Fable en pass       |
| FR-15 | 2.4, 3.2, 6.1           | landmark style test; 1440 x 600 and 1440 x 1400 footer E2E; Fable report       |
| FR-16 | 2.4, 4.2                | `error-page.test.tsx` (`contentinfo`), router test under a stand-in layout     |
| FR-17 | 2.4, 3.1, 3.2, 3.3, 3.4 | `make check-e2e-route-coverage`, jest-axe, visual specs, Lighthouse constants  |
| FR-18 | 5.1, 5.2                | `make lint-adr`, `make lint-docs`                                              |
| FR-19 | 6.1                     | Fable report with calibration, full-resolution exports and recorded masks      |
| FR-20 | PR stage                | PR review                                                                      |

- NFR coverage: NFR-1 to NFR-4 (6.1, NFR-2 against PRD appendix A.4), NFR-5 and NFR-6 (3.1,
  3.2, PR stage), NFR-7 to NFR-9 (2.2 to 3.3; 1.4.12 by the Story 3.3 text-spacing spec, 1.4.4
  and 1.4.10 by the Story 3.2 320 px checks), NFR-10 and NFR-11 (1.3, 2.1, 4.2, bundle comment), NFR-12 (3.4, CI Lighthouse plus the recorded mobile 85 reading),
  NFR-13 (3.1, 4.2, CI), NFR-14 (1.1, 3.1), NFR-15 to NFR-19 (Story Conventions, every story),
  NFR-20 (2.1), NFR-21 and NFR-22 (every story, PR stage). AR-1 to AR-18 each bind a story.
- Architecture file plan: every row of AD§3.2, including the four new style files, the compose
  helper and `lighthouse/constants.js`, is created or edited by exactly one story; the shared
  test files are flagged in the dispatch table and serialised.
- Every PRD test case now has an owning test: FR-7 P1 and FR-15 E1 / E2 (Story 3.2 E2E, was
  R-6), FR-12 E1 (moved from jsdom to E2E), FR-13 E1 (tablet 403 baseline plus E2E), FR-14 E3
  (tab inset); the NFR-19 language-switch clause is re-scoped to the unit card test. Plan
  iteration 2 adds FR-6 E5 (render-thrown 401), FR-13 E2 / E3, FR-14 E4 and the NFR-7 1.4.12
  case, each with an owning test, and moves every en layout check out of the browser lanes
  (which build in uk) into the Story 6.1 en pass.

### 2.3 Decision Compliance (product owner UD-1 to UD-10 and the binding task decisions)

| Decision                                                         | Honoured in                       |
| ---------------------------------------------------------------- | --------------------------------- |
| Catch-all renders 404 (UD-1)                                     | FR-2, D-11, Story 3.1             |
| `RouteError` renders 404 / 403 / 5xx by status, else fallback    | FR-6, D-3 to D-5, Stories 4.1-4.2 |
| Public `/forbidden` and `/server-error`, reachable by Lighthouse | FR-3 to FR-5, NFR-12, 3.2, 3.4    |
| "Запросити доступ" as designed, no code, TODO not in code (UD-4) | FR-8, AD§10.3, Story 2.2 AC, PR   |
| 5xx copy, `5xx` digits, one home button, flagged (UD-5, UD-10)   | FR-4, FR-9, AD§13, PR stage       |
| 404 copy (UD-6)                                                  | FR-9, AD§13, Story 1.1            |
| 403 copy with "На жаль" flagged, outlined + primary (UD-7)       | FR-3, FR-7, FR-9, AD§13, PR stage |
| Content area + existing footer; header and sidebar out (UD-8)    | FR-12 to FR-16, UX-DR8            |
| Fable verification, then the PR (UD-9)                           | FR-19, Story 6.1, PR stage        |
| ADR Deciders `[@kravalg](https://github.com/kravalg)`            | FR-18, AD§16.2, Story 5.1 AC      |

The en home label "Go to homepage" reuses the existing en value of `not_found.cta` and
`error_boundary.go_home`, which the task allowed. No artifact re-opens a decision.

### 2.4 UX Alignment

- Appendix A was re-derived from F§1 to F§3 for the tablet and mobile frames: tab, curve,
  diamond, dot, dot columns and dot rows match to three decimals; the mobile glyph tops
  (14.582 / 37.324 / 14.582, boxes 97 / 101 / 97 x 186) are now in A.3, FR-14, AD§8.3 and the
  Story 1.2 and 2.3 criteria.
- The tab insets (37 / 37, 26 / 27, 19.216 / 19.958) reproduce the drawn widths (540, 421,
  311.174) at the parity widths and keep the tab behind the card below 375 px.
- Description widths in A.2 and A.3 are `-`, with a note that Figma's 354 / 261.652 px are
  fixed-width text boxes; NFR-2 measures ink width with a DOM `Range`.

### 2.5 Epic Quality

- **User value:** each epic names an actor outcome; Epic 1 is enabling data, justified as the
  brownfield first change. Story 3.4 is user-facing (the product owner's Lighthouse reach).
- **Dependencies:** every `Dependency:` line points backwards; 3.4 depends only on 3.2; waves
  A1 to E are consistent with the table; no forward dependency.
- **Commit safety:** groups A to E each end where no dependency-cruiser orphan remains
  (`responsive-styles.ts` and the data tables gain importers inside group A). The commit default
  is now explicit: `HUSKY=0` after the story's local-light checks, explicit staging, manual
  commitlint, CI as verifier, stated in the PR body (closes R-5).
- **Acceptance criteria:** Given / When / Then with exact strings, numbers and CI checks.
- **Scope:** no new module, no `UI*` primitive, no runtime dependency, no edit to
  `registry.ts`, `route-composer.tsx`, `routes.tsx`, `rsbuild.config.ts` or `src/config/**`, so
  the ADR-drift gate stays quiet. `lighthouse/constants.js` is a ratchet `dependsOn` entry, but
  adding URLs weakens no threshold, so no `gate-relaxation` label is needed.

## 3. Repository Fact Spot-Check

### 3.1 Confirmed in this pass

- **jscpd:** `.jscpd.json` has `minTokens: 70`, `minLines: 5`, `threshold: 0`, mode `mild`. A
  prettier-formatted scratch geometry table with `LARGE_DIGITS` / `LARGE_PAGE` shared between
  desktop and tablet reports "Found 0 clones"; the reviewer's verbatim-twice version reported a
  71-token clone.
- **rust-code-analysis:** `config/metrics-policy.json` hard limits are
  `halstead_volume_function_max` 1000, `nom_functions_file_max` 10, `nom_closures_file_max` 6,
  `nom_total_file_max` 15, `halstead_volume_file_max` 8000, `mi_visual_studio_min` 20.
  `scripts/lint-metrics.sh` runs `rust-code-analysis-cli -m -O json`. The AD§14.1 spike
  (scratch `card-styles.ts`, `illustration-styles.ts`, `responsive-styles.ts`) measured
  function volumes 501 / 250 / 265 / 449 (card, title, description, build) and 300 / 266 / 241
  (tab, curve, diamond), `compose` 125, file volumes up to 2222, 4 functions and 0 closures per
  file, MI 36 and above: every hard limit passes.
- **Integration coverage:** `jest.config.ts` collects coverage from `src/**/*.{ts,tsx}` with
  global 100 % thresholds, integration roots `tests/integration`; the chain test imports only
  service modules; `boundary-error-reporter.ts` imports only `observability-core` and
  `security-event-core`, which the suite already loads. The service-seam case adds no new
  `src` file to the integration run.
- **Jest SVG handling:** `moduleNameMapper` has no `svg` entry; `UIFooter` imports
  `vilna-logo.svg`. The five-module mock list in AD§7.2 is complete for the real page.
- **Router test seam:** `route-error.router.test.tsx` already renders
  `<RouterProvider onError={onRouteError} />`, so the reporting assertion moves there without a
  new seam; `routeComposer.routeErrorHandler()` reports through `boundaryErrorReporter` with
  `surface: 'route'`.
- **Composer test:** `tests/unit/routes/route-composer.test.tsx:78-82` pins
  `[ROUTE_PATHS.notFound, ROUTE_PATHS.signUp, ROUTE_PATHS.signIn]`; Story 3.2 now updates it.
- **Lighthouse:** `lighthouse/constants.js` lists `/`, `/sign-up`, `/sign-in`;
  `lighthouse-constants.test.ts:25-31` pins them; `acceptance-standard.md:65-66` asks new
  user-facing routes to be added; `gate-thresholds.manifest.json` lists the constants file as a
  `dependsOn` of both `lighthouserc` files.
- **Figma export:** the `get_screenshot` schema has `maxDimension` (default 1024, caps the longer
  edge) and returns `width` / `height` beside `original_width` / `original_height`;
  `enableBase64Response` appends the image inline.
- **Docs:** CLAUDE.md:2373 reads "The app shell's own routes (home + 404) live in
  `src/routes/app-routes.ts`"; Story 5.2 and AD§16.3 now update it.
- **Plan iteration 2 facts:** `src/i18n.js` calls `init({ lng: rawEnv.mainLanguage() })`,
  `raw-env.ts` returns the inlined `REACT_APP_MAIN_LANGUAGE ?? 'uk'`, no detector or switcher
  exists. `lighthouserc.desktop.js`: performance, accessibility, best practices 0.95, SEO 0.9;
  `lighthouserc.mobile.js`: performance 0.84 `median-run`, the other three 0.9. `AppRouteObject`
  has no `loader` / `action`; `RouteMapper.map()` emits `element` and `errorElement` only;
  `src/` declares no route loader. react-router 7.18.4: `RenderErrorBoundary`
  `getDerivedStateFromError` returns `{ error }` unchanged, `componentDidCatch` forwards to
  `onError`, `isRouteErrorResponse` needs boolean `internal` and a `data` key, `data()` builds
  `{ type: 'DataWithResponseInit', data, init }` with `init` null or `{ status }`.
  `tests/jsdom-fetch-environment.cjs` exposes `Response`. `axe-config.ts` carries four #276
  entries today. Figma `get_metadata`: titles 236 (143:12586, 143:12601), 144 (143:12630), 384
  (172:6685); 403 description 399 hug at x 108 (172:6686); 404 descriptions are 354 / 354 /
  261.652 fixed boxes (143:12587, 143:12602, 143:12631).
- **Plan iteration 3 facts (Figma, read-only `use_figma`, 2026-10-01):** dot 143:12572
  rotation −170.904, `x` / `y` 580.842 / 104.222 inside Frame 307 (frame 538, 159), but
  `absoluteBoundingBox` at frame (1107, 253), 11.842 x 11.856, i.e. O(569, 94), and
  `absoluteRenderBounds` 10.338 x 10.354 centred at O(574.921, 99.928); 5xx 172:6928 bbox frame
  (982, 234) with O(413, 140), i.e. O(569, 94); 403 172:6689 bbox frame (982, 234) with Frame
  314 296:15117 at frame (538, 203), i.e. O(444, 31); 403 diamond 172:6688 frame (457, 194),
  O(−81, −9); tablet 143:12605 rotation −171.066, bbox frame (981.225, 234), 12.06 x 11.856,
  O(552.225, 94), render 10.529 x 10.354 centred at O(558.255, 99.928). Mobile rows
  143:12657 / 12654 / 12648 / 12651 rotation 90, bbox tops 638.999 / 655.825 / 674.368 /
  691.368 (O-relative 437.387 / 454.213 / 472.756 / 489.756, O y 201.612), last bottom 698.09,
  footer 143:12205 at y 772. The only rotated nodes in the four frames are the dot, the mobile
  rows and footer internals; the desktop and tablet dot columns are unrotated, so their values
  stand.
- **Plan iteration 3 facts (repository):** `tests/utils/a11y/keyboard.ts:44-56` compares the
  computed focus style only when `stop.visibleFocus`; `acceptance-standard.md:115-120` requires
  `visibleFocus: true` on static-style stops and lines 25-26 and 31-33 name only `/`, `/sign-in`,
  `/sign-up` for Lighthouse; `home-keyboard.a11y.spec.ts:42-44` sets it on every stop;
  `.husky/pre-commit` runs `make format`, `git add -A`, `make lint`, `make test-unit-all`;
  `src/utils/use-focus-on-mount.ts` calls `node?.focus()` with no `preventScroll`;
  `UILiveStatus` carries the visually hidden object but also `role="status"`.
- Carried from readiness 1 and still true: `isRouteErrorResponse` needs the router-produced
  shape; svgo `preset-default` includes `removeViewBox`; the integration chain test path is
  `tests/integration/services/security-events/`; jscpd 70 in `.jscpd.json` vs 75 in CLAUDE.md.

### 3.2 Inaccurate

None found in the corrected artifacts.

## 4. Findings

Severity scale: **critical** blocks implementation; **major** would make a story fail as
written or mislead a gate; **minor** is a gap an implementer can absorb with a small, named
edit; **info** needs no action. "Applied" means fixed at source in the named artifacts and
re-verified in this pass.

### 4.1 Readiness-1 findings

| ID  | Severity      | Finding                                                        | Status and where fixed                                                       |
| --- | ------------- | -------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| R-1 | major         | Detector test fed `data()` / `Response` straight to `detect()` | Applied: AD§5.2 matrix and Story 4.1 use the router-shaped literal           |
| R-2 | minor → major | Mobile glyph tops missing from the parity reference            | Applied as E-6 (raised: 14.58 px error, ten times NFR-1)                     |
| R-3 | minor         | svgo `removeViewBox` vs unit-test blindness                    | Applied: roots carry no `width`/`height` (AD§7.1, Story 2.1, RK-7)           |
| R-4 | minor         | Stale visual comment and manifest text                         | Applied: Story 3.1 amends both                                               |
| R-5 | minor         | Hook default runs full suites locally                          | Applied: `HUSKY=0` default in the Story Conventions and PR stage             |
| R-6 | minor         | FR-7 P1 and FR-15 E1 had no owning test                        | Applied: Story 3.2 E2E (home clicks, 1440 x 600 and 1440 x 1400)             |
| R-7 | minor         | Integration case rendered real SVG imports                     | Superseded by E-3 (no rendering in integration) and E-10 (router-test mocks) |
| R-8 | minor         | ADR-018 outline headings malformed                             | Applied: AD§16.2 rewritten in the template shape; Story 5.1 note             |
| R-9 | minor         | Integration test path wrong in AD§15.2                         | Applied: AD§15.2 rewritten with the real path                                |

### 4.2 External review findings (plan iteration 1/5)

| ID   | Severity | Finding (abridged)                                                     | Verification                                                                 | Status and where fixed                                                                       |
| ---- | -------- | ---------------------------------------------------------------------- | ---------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| E-1  | major    | Verbatim desktop/tablet geometry blocks are a jscpd clone              | Confirmed: `.jscpd.json` 70 / 0; shared-`const` spike reports 0 clones       | Applied: AD§8.3 `LARGE_*` sub-records, D-2, AR-2; Story 1.2 files, `lint-dup` check and AC   |
| E-2  | major    | Style plan cannot meet both rust-code-analysis caps                    | Confirmed: policy limits; per-breakpoint fragment spike passes (section 3.1) | Applied: AD§14.1 six area classes + `compose`; AR-16; Stories 1.2, 2.1 to 2.4; RK-13         |
| E-3  | major    | Integration case would load the page graph and fail 100 % coverage     | Confirmed: `collectCoverageFrom` `src/**`, global 100 %, service-only suite  | Applied: AD§15.2 service-seam case; Story 4.2; render proof moved to the router unit test    |
| E-4  | major    | `get_screenshot` has no scale; default 1024 shrinks every frame        | Confirmed: tool schema (`maxDimension` default 1024, `original_*` returned)  | Applied: PRD NFR-4, Story 6.1 step 3 and AC (`maxDimension` per frame, dimension check)      |
| E-5  | major    | NFR-4 crop does not mask the planned deviations                        | Confirmed against the PRD and Figma coordinates in the finding               | Applied: PRD NFR-4 masks (5xx text, 403 text and diamond/dot, mobile clip), FR-19, AD§18     |
| E-6  | major    | Mobile glyph tops missing (was R-2)                                    | Confirmed against F§3.2 and the finding's `get_metadata` values              | Applied: PRD A.3 and FR-14, AD§8.3, Stories 1.2 and 2.3 AC                                   |
| E-7  | major    | Script focus at load matches `:focus-visible`, so the `h1` ring shows  | Accepted on the reported Chromium 149 measurement; consistent with the spec  | Applied: `h1` `'&:focus': { outline: 'none' }` (AD§12, AR-17, FR-11, Stories 2.3, 3.3)       |
| E-8  | major    | Error routes kept out of Lighthouse against UD-3 and the a11y standard | Confirmed: `acceptance-standard.md:65-66`, `constants.js`, pinned test       | Applied: new Story 3.4, PRD NFR-12 / FR-17 / scope, AD§11.4, brief and research notes        |
| E-9  | major    | `route-composer.test.tsx` pins the public route list                   | Confirmed: lines 78-82                                                       | Applied: Story 3.2 files, check and AC; AD§15.1 row                                          |
| E-10 | minor    | Router test loads raw SVGs and silently renders the fallback           | Confirmed: no `svg` mapper; footer imports `vilna-logo.svg`                  | Applied: AD§7.2 mock rules; Story 4.2 router and route-error-page tests assert the `h1`      |
| E-11 | minor    | Figma description box widths are not rendered geometry; ink width      | Confirmed: centred `p` with no width in AD§8.2                               | Applied: PRD A.2 / A.3 `-` plus note, NFR-1 / NFR-2 `Range` method, Story 6.1 step 2         |
| E-12 | minor    | Tab protrudes past the card below about 355 px                         | Confirmed: 320 − 24.6 = 295.4 < 330.39                                       | Applied: tab insets (AD§8.2, §8.3), FR-14 acceptance and E3, Story 3.2 E2E AC                |
| E-13 | minor    | PRD cases without tests (tablet 403, 1920, language switch)            | Confirmed: no 403 tablet screen, jsdom-only 1920 AC, no switcher UI          | Applied: `forbidden-tablet` baseline and en row E2E, FR-13 E1 widths fixed, 1920 E2E, NFR-19 |
| E-14 | minor    | CLAUDE.md "home + 404" route sentence not in the doc sync              | Confirmed: CLAUDE.md:2373                                                    | Applied: Story 5.2 file list and AC, AD§16.3                                                 |

No finding was rejected.

### 4.3 External review findings (plan iteration 2/5)

| ID  | Severity | Finding (abridged)                                                               | Verification                                                                                                                                                                                                      | Status and where fixed                                                                                                                                                                                     |
| --- | -------- | -------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| F-1 | major    | Generated-content digits take a known 1.4.3 failure out of the axe gate          | Confirmed: 2.37:1 and 1.58:1 recomputed; 403 code and `5xx` class appear only in the digits; CLAUDE.md issue #118 "No suppression" rule; four #276 entries as precedent                                           | Applied as proposed: DOM-text digits in `#error-page-digits`, second entry `#error-page-digits > span` (#276), RK-4 replaced, assumption dropped (AD§8.4, §10.4, PRD NFR-7 / NFR-8, AR-14, Story 2.3, 5.2) |
| F-2 | major    | Status branch unreachable: routes have no loaders, render throws stay raw        | Confirmed: `app-route.ts` has no loader/action, mapper emits element + errorElement, `RenderErrorBoundary` keeps the raw value, `isRouteErrorResponse` rejects it                                                 | Applied, option (a): detector reads router responses, thrown `Response` and `data()`; render-throw router tests; J2, J3, R8, FR-6, AD§5.2, ADR-018 outline, Stories 4.1, 4.2                               |
| F-3 | major    | E2E criteria assert en layout, but every browser lane builds in uk               | Confirmed: `src/i18n.js` fixes `lng` from the build-time env, no detector or switcher; NFR-19 admits it                                                                                                           | Applied: uk E2E (403 row 449 px at 1024, uk wraps at 320 / 375); en checks in a Story 6.1 en pass on `make start` with `REACT_APP_MAIN_LANGUAGE=en` (J6, FR-13 E1 / E3, FR-14 E2, FR-19, AD§15.4, §18)     |
| F-4 | minor    | Lighthouse ACs cite "desktop 95 / mobile 85", not the real assertions            | Confirmed: mobile perf 0.84 median-run, mobile a11y / BP / SEO 0.9, desktop SEO 0.9                                                                                                                               | Applied: real per-category assertions in NFR-12, AD§11.4, RK-19, Story 3.4; profile 85 read from the LHCI report into the PR; existing three URLs not re-scored                                            |
| F-5 | minor    | NFR-2 ink check has no reference width for most runs                             | Confirmed with `get_metadata`: titles 236 / 236 / 144 / 384 are hug boxes; 404 descriptions are fixed boxes; additionally the 403 description copy changes ("На жаль") and the 5xx copy is a placeholder          | Applied: PRD appendix A.4 (references with nodes, n/a runs covered by NFR-1 and NFR-4), NFR-2 note, FR-19, Story 6.1 step 2 and AC                                                                         |
| F-6 | minor    | Wrapped text runs flush against the card border (no horizontal inset)            | Confirmed: AD§8.3 derived only vertical padding; uk 403 description about 374 px at 15 px vs about 316 px of mobile card text width                                                                               | Applied with a changed scope: 24 / 24 / 16 px inset on the title and description only (see F-9 for why the actions row is excluded); geometry `textInset`, card-styles test, Story 3.2 inset E2E           |
| F-7 | minor    | Nothing checks that digits and card stay inside a 320 px viewport                | Confirmed: `overflow-x: clip` keeps clipped content out of `scrollWidth`                                                                                                                                          | Applied: FR-14 E4, AD§15.4 and Story 3.2 assert each `#error-page-digits > span` and the card lie within x 0 to 320; Story 6.1 checks 375                                                                  |
| F-8 | minor    | NFR-7 1.4.12 and 200 % zoom claimed with jsdom-only tests                        | Confirmed: Story 2.3 tests were all jsdom; no spec applied the 1.4.12 overrides                                                                                                                                   | Applied: `error-pages-text-spacing.a11y.spec.ts` (Story 3.3, manifest row, coverage map); 200 % zoom wording dropped, 1.4.4 mapped to the 320 px reflow checks                                             |
| F-9 | minor    | Same inset gap; proposes Figma box max-widths (354 / 261.652) or 44 / 60 padding | Partly confirmed: the gap is real (merged with F-6), but both remedies break the frames: the 403 desktop description is a 399 px hug box (wraps under a 354 cap) and 60 px padding wraps the 449 px uk tablet row | Applied with a changed remedy: the F-6 inset (24 / 24 / 16) keeps every 404 run and the 403 desktop title and description on one line; Figma boxes recorded as non-caps in AD§8.2                          |

Verification also surfaced one latent defect in the plan, fixed in the same pass: the previous
router-test matrix threw `new Response(null, { status: 600 })`, which the `Response`
constructor rejects with a `RangeError`; status 600 is now fed only as a router literal and as
`data(null, 600)` (AD§5.2, Stories 4.1, 4.2).

### 4.4 External review findings (plan iteration 3/5)

| ID  | Severity | Finding (abridged)                                                                     | Verification                                                                                                                                                                                                     | Status and where fixed                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| --- | -------- | -------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| G-1 | major    | Dot taken from the rotated node's `x` / `y`, about 11.8 / 10.2 px off on 1440 and 1024 | Confirmed by `use_figma` (section 3.1): bbox O(569, 94) on 404, 403 and 5xx desktop, O(552.225, 94) on tablet; render centres (574.921, 99.928) and (558.255, 99.928); the plan's values equal `x` / `y` minus O | Applied as proposed: PRD A.1 / A.2 and the appendix rule (rotated nodes by `absoluteBoundingBox` only); AD§8.3 dot row and derived rule; research §4.1 and note; Figma spec §1, §2.1, §6 and rule; Story 1.2 and 2.1 ACs                                                                                                                                                                                                                               |
| G-2 | major    | Mobile dot rows 6.74 px too low (rotated group `y` is its bottom edge)                 | Confirmed: bbox tops O 437.387 / 454.213 / 472.756 / 489.756, last bottom 698.09, footer 772, card bottom 619.22                                                                                                 | Applied as proposed: PRD A.3, FR-14 (19.78 gap, 59.09 block), FR-15 (73.91 minimum gap and assumption); AD§8.2 (78.87), §8.3 (page 73.91, composition 78.87, `dotRows` 59.091 / 19.779), §18; epics FR-15, Stories 1.2, 2.1, 2.4, 6.1; research §4.5, §4.6; Figma spec §3                                                                                                                                                                              |
| G-3 | major    | No browser test proves the focus ring is drawn                                         | Confirmed: `keyboard.ts:44-56`, `acceptance-standard.md:115-120`, every precedent stop uses `visibleFocus: true`; 0 hits across the artifacts                                                                    | Applied with the optional check: `visibleFocus: true` on all four `/forbidden` stops plus a single-stop check of the contained home link on the catch-all and `/server-error` (PRD FR-11 E1, AD§11.4, §15.5, epics FR-11, Story 3.3 files and ACs)                                                                                                                                                                                                     |
| G-4 | minor    | Mobile dot rows inherit the base `display: none` and never render                      | Confirmed: `compose` spreads the desktop fragment at the top level and media blocks only add declarations                                                                                                        | Applied as proposed: mobile `dotRows` and desktop / tablet `dot`, `dotColumns` fragments declare `display: 'block'`, pinned by `dot-styles.test.ts` (AD§8.3 bullet, §14.1; Story 2.1 files, test and AC)                                                                                                                                                                                                                                               |
| G-5 | minor    | Story 3.1 says "group A commit (hook run)" against the `HUSKY=0` default               | Confirmed: `.husky/pre-commit` runs `git add -A` and `make test-unit-all`; Story Conventions make `HUSKY=0` binding                                                                                              | Applied as proposed: Story 3.1 verification, the dispatch assumption and the Final Validation commit-safety line                                                                                                                                                                                                                                                                                                                                       |
| G-6 | minor    | NFR-4 403 dot masks built from the rotated node's `x` / `y`                            | Confirmed: 172:6689 bbox O(444, 31); rendered dot O(569, 94); diamond masks correct                                                                                                                              | Applied as proposed: PRD NFR-4 (Figma x 444 to 455.842, y 31 to 42.856; rendered x 569 to 580.842, y 94 to 105.856), Figma spec §6.3                                                                                                                                                                                                                                                                                                                   |
| G-7 | minor    | Digits called information yet hidden from assistive technology (WCAG 1.3.1)            | Confirmed: the 403 and 5xx titles and descriptions name no code (AD§13)                                                                                                                                          | Applied, option (a): a visually hidden `p` with `error_page.<variant>.code` after the `h1` (three new keys, eleven in all; `codeKey`; card token `statusCode`), no pixel change; the scoped axe entry stays for the visible glyphs' 1.4.3 failure (PRD FR-9, FR-11, N1, NFR-7; AD§3.1, §3.2, §4.1, §4.2, §8.4, §12, §13, §14.1, §15.1; brief; epics FR-11, AR-14, Stories 1.1, 1.2, 2.3). Option (b) not taken: on 403 and 5xx the code is information |
| G-8 | minor    | Acceptance standard's Lighthouse URL list missing from the doc sync                    | Confirmed: `acceptance-standard.md:25-26` and `31-33` name three routes; Story 5.2 omitted it; AD§16.3 hedged                                                                                                    | Applied as proposed: Story 5.2 file bullet and a new AC; AD§16.3 hedge dropped                                                                                                                                                                                                                                                                                                                                                                         |
| G-9 | minor    | Focus on mount scrolls a short viewport; no requirement or test                        | Confirmed: `use-focus-on-mount.ts` has no `preventScroll`; the tablet query covers an 839 x 412 landscape phone; `h1` at 430 px                                                                                  | Applied, option (b) plus a test: an explicit assumption (PRD FR-11, AD§12 decision), E4 at 839 x 412 asserting the focused `h1` is fully in the viewport (AD§11.4, §15.5, Story 3.3), flagged for design and the Fable reviewer (AD§18, Story 6.1). Option (a) not taken: a page-local hook forks shared focus behaviour and adds a dependency-array mutant needing a thirteenth annotation                                                            |

No finding was rejected.

### 4.5 Info notes

| ID   | Note                                                                                                                                                                   |
| ---- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| I-1  | Closed: PRD FR-12 / FR-13 headings and the section 8 assumption now match D-8.                                                                                         |
| I-2  | Closed: `route-error-page.test.tsx` loads the module fresh per case (AD§15.1, Story 4.2).                                                                              |
| I-3  | The a11y edit hook also blocks `.ts` under `*/components/*`; running `accessibility-lead` once from the main loop covers both.                                         |
| I-4  | Closed: AD§6.1 counts the eleven eager colour tokens (about 0.3 to 0.4 kB raw).                                                                                        |
| I-5  | Brief and research name an `ErrorPageLoader` class; the downstream `errorPageLoader` instance wins.                                                                    |
| I-6  | CLAUDE.md documents jscpd `minTokens` 75 while `.jscpd.json` says 70; out of scope for #309.                                                                           |
| I-7  | The 320 px tab check reaches the tab by DOM order from `main h1` because `src` ships no test ids; a DOM reorder must update the spec.                                  |
| I-8  | The `forbidden-tablet` screen adds three baselines with no parity claim; the PR stage now commits nine 403 / 5xx baselines.                                            |
| I-9  | The Figma base64 export is inline in the tool response; the Story 6.1 reviewer decodes it into the scratch directory. Any other fetch path needs explicit permission.  |
| I-10 | The en pass edits only the local, untracked `.env` and restores it; a forgotten value would build en locally but never reach CI, which copies `.env.example`.          |
| I-11 | The local Figma spec note is outside the repository; it was corrected for consistency (G-1, G-2, G-6) but is not committed.                                            |
| I-12 | G-7 adds a `statusCode` literal to `ErrorPageCardStyles.build()` and G-4 adds `display` keys; both are small against the spike's headroom; `make lint-metrics` checks. |

Critical findings open: 0. Major findings open: 0. Minor findings open: 0. Info notes: 12.

> Assumption: E-7 is accepted without re-running the Chromium probe in this pass. The finding's
> measurement matches the documented `:focus-visible` heuristic for script focus without prior
> pointer input, and the chosen fix (no outline on a non-operable programmatic focus target)
> is correct whichever way a browser resolves it; Story 3.3 asserts the result in all three
> engines.
>
> Assumption: E-2's fix is the AD§14.1 layout rather than data-only CSS fragment tables,
> because the fragment methods keep every Figma number in one geometry table and the spike
> proves the caps hold; each style story still runs `make lint-metrics` before it is done.

## 5. Unresolved Risks (carried)

- **RBAC merge order (RK-9):** PR #230 adds `accessDenied: '/access-denied'` to
  `route-paths.ts`; the second PR to merge rebases onto `ROUTE_PATHS.forbidden`.
- **Second contrast exception:** the decorative digits add a sixth #276 entry; it is scoped to
  `#error-page-digits > span`, flagged in the PR, and removed when #276 changes the palette.
- **Render-thrown status values (RK-4):** the detector's `data()` check depends on react-router's
  `type: 'DataWithResponseInit'` shape (7.18.4); a react-router major that changes it is caught
  by the detector and router tests.
- **Visual baselines (RK-10):** the visual job is red until the PR stage commits the
  container- or artifact-generated baselines (6 overwritten 404 `desktop` / `mobile` files,
  3 new 404 `tablet`, 9 new 403 and 5xx including `forbidden-tablet`).
- **Lighthouse floors on the error routes (RK-19):** unmeasured until CI runs; a miss goes to
  the product owner as an explicit question, never a budget change.
- **Lost in-place retry for 5xx route responses (RK-5):** recorded by ADR-018 and flagged in
  the PR.

## 6. Summary and Recommendations

### 6.1 Overall Readiness Status

**Ready.** Coverage is complete after plan iteration 3/5: 20 of 20 FRs and all 22 NFR ids map to a story and a named
test or check, every PRD test case has an owner, every product owner decision is honoured
(including Lighthouse reach), and the plan fits the repository gates: jscpd 70 (spike 0
clones), rust-code-analysis (spike within every hard limit), integration 100 % coverage
(service-seam case), class-only `.ts`, type-only files, no `data-testid`, direct isolated-load
tests, lazy MUI, no ADR-drift trigger, Deciders `@kravalg`. The status branch is reachable from
today's render-only routes, the digits are scanned and covered by a scoped #276 entry, and no
browser-lane criterion asks for a language the lane cannot render. After plan iteration 3 every
rotated Figma node is read by its bounding box, the mobile rows are displayed by an explicit
`display` reset, the keyboard lane proves the focus rings are drawn, the status code reaches
assistive technology on every page, and the short-viewport behaviour is a recorded, tested
decision.

### 6.2 Critical Issues Requiring Immediate Action

None.

### 6.3 Recommended Next Steps

1. `/fe-sdlc-implement` from waves A1 (Stories 1.1, 1.3) onward, with `accessibility-lead` run
   once from the main loop before the first UI story.
2. Run `make lint-metrics` and `make lint-dup` on the first style file (Story 1.2's
   `responsive-styles.ts`, then Story 2.3's `card-styles.ts`) to confirm the spike on real code.
3. Commit per group with the `HUSKY=0` default and let CI verify; Story 6.1 then the PR stage.

### 6.4 Final Note

Plan iteration 1/5 verified and applied 23 findings (9 from readiness 1, 14 external). Plan
iteration 2/5 verified 9 more external findings (F-1 to F-9) against the repository, the
installed react-router and the Figma file: 7 applied as proposed, 2 (F-6, F-9) applied with a
remedy changed to keep the frames' one-line runs, none rejected, plus one latent defect found
during verification (status 600 as a `Response`). This pass found no new critical, major or
minor issue in the plan iteration 2 chain. Plan iteration 3/5 verified 9 more external
findings (G-1 to G-9) with read-only Figma scripts and the repository: all 9 confirmed and
applied, G-7 and G-9 by a chosen option with the other option's rejection recorded, none
rejected. This pass re-checked the corrected chain for consistency (no stale 580.842, 26.52,
67.19, 85.59 or "hook run" text remains; prettier passes) and found no new critical, major or
minor issue; 12 info notes remain.

Verdict: PASS
