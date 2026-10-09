---
status: 'complete'
workflowType: 'research'
researchType: 'technical'
project_name: 'crm'
date: '2026-10-01'
issue: 309
branch: 'feat/309-error-pages'
base: 'origin/main cff55203 (after #306 toolkit v0.6.0, #307 deps / React 19.3 / ADR-017)'
inputDocuments:
  - 'https://github.com/VilnaCRM-Org/crm/issues/309'
  - 'Figma file xZ7ccrH6d4QyqLQsayFSEX, nodes 143:12154, 143:12166, 143:12178, 172:6675, 172:6914'
  - 'src/components/not-found/'
  - 'src/components/error-boundary/'
  - 'src/lib/reliability/recovery-strategy-detector.ts'
  - 'src/routes/route-paths.ts'
  - 'src/routes/app-routes.ts'
  - 'src/styles/fonts.css'
  - 'config/performance-budget.json'
  - '.jscpd.json'
  - 'tests/utils/a11y/axe-config.ts'
---

# Technical Research: 404 / 403 / 5xx error pages from Figma (#309)

This artifact consolidates three research notes (codebase map, pixel-level Figma spec, CI gate
obligations) into one verified baseline for the #309 planning chain. Facts were spot-checked in
the worktree on 2026-10-01 (catalog values, route table, detector branch, font files, jscpd
config, budget file, axe exceptions, contrast ratios). Where the notes disagreed, section 10
records the resolution. Every number taken from Figma is a tool value unless marked
**ESTIMATED**.

## 1. Scope and binding decisions

The product owner fixed these decisions; the plan does not re-open them.

- **Wiring.**
  - The catch-all route (`ROUTE_PATHS.notFound`, `'*'`) renders the 404 page.
  - `RouteError` renders the 404 / 403 / 5xx page when a route error response carries that
    status. Every other error keeps today's `ErrorFallback` recovery behaviour.
  - Two **new public routes**, `/forbidden` and `/server-error`, render the 403 and 5xx pages
    directly. They make the pages reachable by E2E, visual and Lighthouse runs, and give the RBAC
    work (#114) a redirect target.
- **403 "Запросити доступ" (Request access).** Rendered exactly as designed, with no behaviour:
  no access-request flow exists. The TODO is tracked in the PR and in these specs, never as an
  inline code comment.
- **5xx copy.** The frame carries placeholder copy. Ship uk `Помилка сервера` /
  `Сервер тимчасово недоступний. Спробуйте пізніше.` and en `Server error` /
  `The server is temporarily unavailable. Please try again later.`. The digits stay `5xx`, with
  one `На головну` button. Flag the copy for design confirmation in the PR.
- **404 copy.** `Помилка 404` / `Сторінки не існує` / `На головну`.
- **403 copy.** Title `В доступі відмовлено`, buttons `На головну` (outlined) and
  `Запросити доступ` (primary). The design body reads "Нажаль, у вас немає прав доступу до цієї
  сторінки".
- **In scope:** the content area plus the existing footer. **Out of scope:** the app header
  (search, notifications, user) and the left sidebar drawn in the frames. No such shell exists,
  and it is a separate issue. Pixel-perfect comparison is made against the content area only.
- **Verification.** After implementation, a Fable-model agent compares the rendered pages with
  the Figma frames. Then a PR is opened for #309.

> Assumption: the uk 403 body ships with the correct orthography "На жаль, у вас немає прав
> доступу до цієї сторінки" instead of the design's "Нажаль". The deviation is flagged for design
> in the PR.

> Assumption: the en home-button label reuses the established en wording "Go to homepage" (the
> value of `not_found.cta` and `error_boundary.go_home` today). Only the value is reused, not the
> key, because the i18n gate allows one owner per key.

## 2. Figma frames

File key `xZ7ccrH6d4QyqLQsayFSEX`, page "Design CRM".

| Variant     | Node                                                                                               | Frame size | Frame bg  | Footer instance (y, size)           |
| ----------- | -------------------------------------------------------------------------------------------------- | ---------- | --------- | ----------------------------------- |
| 404 desktop | [143:12154](https://www.figma.com/design/xZ7ccrH6d4QyqLQsayFSEX/VilnaCRM--Copy-?node-id=143-12154) | 1440x1000  | `#FBFBFB` | 143:12165 → 15:844, 875, 1440x123   |
| 404 tablet  | [143:12166](https://www.figma.com/design/xZ7ccrH6d4QyqLQsayFSEX/VilnaCRM--Copy-?node-id=143-12166) | 1024x1366  | `#FBFBFB` | 143:12169 → 15:1016, 1240, 1024x126 |
| 404 mobile  | [143:12178](https://www.figma.com/design/xZ7ccrH6d4QyqLQsayFSEX/VilnaCRM--Copy-?node-id=143-12178) | 375x1082   | `#FBFBFB` | 143:12205 → 19:814, 772, 375x298    |
| 403 desktop | [172:6675](https://www.figma.com/design/xZ7ccrH6d4QyqLQsayFSEX/VilnaCRM--Copy-?node-id=172-6675)   | 1440x940   | `#FBFBFB` | 172:6679 → 15:844, 876, 1440x123    |
| 5xx desktop | [172:6914](https://www.figma.com/design/xZ7ccrH6d4QyqLQsayFSEX/VilnaCRM--Copy-?node-id=172-6914)   | 1440x940   | `#FBFBFB` | 172:6918 → 15:844, 876, 1440x123    |

Frames 172:6675 and 172:6914 are both named "Помилка 404 desktop" in Figma (copy-paste names).
Ignored layers: the app header (`Frame 66` 296:14845, `Frame 63` 296:14930, `Frame 68` 296:15013,
`Frame 293` 296:15250), the sidebar (`Frame 292`) and the mobile browser chrome (`Group 1`
143:12181, 375x94). Figma MCP asset URLs expire seven days after 2026-10-01 and are off-origin,
so they must never be referenced from the app (section 8.4).

## 3. Current error surfaces (verified)

### 3.1 The 404 page: `src/components/not-found/`

- `not-found.tsx` is a page module. It calls `usePageTitle('not_found.title')` and renders
  `<UIBackToMain />`, an MUI `Box component="main"` holding a `UITypography` h1 (variant `h4`),
  a description, and a `UIButton to={ROUTE_PATHS.home}`, then a statically imported `<UIFooter />`.
  The `<main>` has no `tabIndex` and no arrival focus.
- Catalog `i18n/{en,uk}.json`: `not_found.{title,description,cta}`. The uk values today are
  `Сторінку не знайдено` / `Сторінку, яку ви шукаєте, не існує.` / `На головну сторінку`. The
  same catalog also owns **`route_fallback.loading`**, which `src/components/route-fallback`
  consumes. Moving or renaming this catalog must keep that key somewhere.
- The page is loaded only as a lazy route chunk from `src/routes/app-routes.ts`
  (`webpackChunkName: "not-found"`, `guard: 'public'`). As a mapped page it renders inside
  `ThemedChunkLoader` (the lazy `mui-theme` chunk, ADR-017) under `RootLayout`'s Suspense, not
  under `AppLayout`.

### 3.2 The error-boundary family: `src/components/error-boundary/`

- `UIErrorBoundary` (class) classifies with `recoveryStrategyDetector`, reports through the
  `reporter` prop with a `surface`, and renders `<ErrorFallback landmark="main">` keyed by
  `attempt`. It is mounted by `src/index.tsx` (`surface="app"`) and composed by
  `AuthErrorBoundary` (`surface="auth"`).
- `ErrorFallback` is **Emotion-only, MUI-free**. It renders a `main` or a labelled `section`
  landmark with `lang`, a focused `<h1 tabIndex={-1}>` (`useFocusOnMount`), a `role="alert"`
  message, a strategy-gated button (`retry`/`reset` → Try again, `reload` → Reload), an
  unconditional plain `<a href="/">` home link, and dev-only diagnostics. Its styles come from
  the `ErrorFallbackStyles` singleton (`styles.ts`), whose `build()` runs at module scope.
- `RouteError({ landmark })` reads `useRouteError()`, classifies it, and renders `ErrorFallback`
  keyed by `location.key`. Its `toError` maps a route response to `Error("<status> <statusText>")`.
  It does **not** branch on `status` today.
- Types live in `src/components/types/error-boundary/index.ts` (`FallbackLandmark`,
  `ErrorFallbackProps`, `RouteErrorProps`, and others).

### 3.3 Recovery classification: `src/lib/reliability/recovery-strategy-detector.ts`

`classify()` tries, in order: a recoverable-error value; the `{ retryable }` duck type; a chunk
load error; `isRouteErrorResponse` (`status >= 500` → `retryable`, otherwise → `route`, i.e.
navigate-home with `error_boundary.route`); then unexpected. So today a 404 or 403 route
response shows "This page is not available" with a home link, and a 5xx shows **Try again**. The
`RecoverableError` it returns carries no `status`.

### 3.4 Wiring, and which chunk `RouteError` lands in

- `route-composer.tsx` and `route-mapper.tsx` import `RouteError` **statically**. `routes.tsx`
  builds the router at module eval, and `app.tsx` and `index.tsx` import it eagerly. Therefore
  `RouteError`, `ErrorFallback`, `error-boundary/styles.ts`, the detector and `use-focus-on-mount`
  are all in the **eager entrypoint**. `index.tsx` also imports `ErrorFallback` and
  `UIErrorBoundary` directly for the bootstrap path.
- The composer gives the root route, both layout routes and every mapped page an
  `errorElement`: `landmark="region"` under `AppLayout` (its `<main>` would otherwise nest a
  second one), `"main"` elsewhere.
- **When a route error response actually reaches `RouteError`.** No route declares a `loader` or
  `action`, and the `'*'` catch-all swallows unknown paths. A `RouteErrorResponse` therefore
  reaches `RouteError` only if code throws a `Response` or `data(..., { status })`, or through
  react-router's own 4xx/405 internals. Unknown URLs never reach `RouteError`; they render the
  `notFound` page. The status-aware branch is mostly forward-looking (RBAC #114, future loaders)
  and is covered by unit tests with `createMemoryRouter`, not by E2E.

### 3.5 Layouts and theme delivery

- `RootLayout` sets `<html dir>` and wraps the outlet in `<Suspense fallback={<RouteFallback />}>`.
  It has no landmark and no footer, so **public pages own their `<main>` and footer**.
- `AppLayout` (protected only) owns `<main tabIndex={-1}>` with `useArrivalFocus` and a lazy
  `UIFooter` from `footer-loader.ts`, a `ThemedChunkLoader` over a `ChunkRetryLoader` of the
  `ui-footer` chunk and the `muiThemeShellLoader`.
- `AppProviders` has no MUI `ThemeProvider` (ADR-017). Anything rendered by `RouteError` sits
  **outside** any page theme, so a new MUI surface there must be wrapped in `ThemedChunkLoader`
  or it falls back to MUI's default theme.
- `#root` is a flex column with `min-height: 100vh/100dvh`. `body` is `#fff` with a system font
  stack; the frames use `#FBFBFB` (`Grey bg`) for the page background.

## 4. Figma composition

### 4.1 One composition, three variants

All five frames share one model: three status digits (middle glyph dropped) → a yellow tab
behind the card → a white card (title, description, one or two buttons) → a decoration layer
(dashed curve, diamond, dot, dot columns or rows). Only the digit colour and shadow, the glyphs,
the copy and the button set vary by status. That is one implementation with three
configurations, which jscpd demands anyway (section 7).

Desktop composition box: 614x552. Paint order, bottom to top: yellow tab → dashed curve →
digits → card → diamond → dot → dot columns. Positions are relative to the composition origin.

| Layer                | x             | y             | w      | h            | Notes                                                                       |
| -------------------- | ------------- | ------------- | ------ | ------------ | --------------------------------------------------------------------------- |
| Yellow tab           | 37            | 301           | 540    | 225          | `#FFC01E`, radii 32 32 0 0                                                  |
| Dashed curve         | −56           | 36            | 643    | 357          | `#00A3FF` at node opacity 0.3                                               |
| Digits frame         | 74            | 0             | 466    | 330          | glyphs left-aligned in the frame                                            |
| Card                 | 0             | 330           | 614    | 222          | white, 1 px `#EAECEE` inside, radius 16                                     |
| Diamond              | 44            | 54            | 40     | 40           | `#01A6FF` outline square rotated 45°                                        |
| Dot                  | 569           | 94            | 11.842 | 11.856       | `#0B315E`, circle Ø ≈ 10.34, centre (574.921, 99.928) (absoluteBoundingBox) |
| Dot columns 10/8/6/4 | −27.654 … −80 | 376 … 427.607 | ≈ 6.74 | 161.5 … 58.4 | `#E1E7EA`, centred on y 456.77                                              |

Rotated nodes (the dot at −170.904°, the mobile dot rows at 90°) are placed by their Figma
`absoluteBoundingBox` / `absoluteRenderBounds`, never by `node.x` / `node.y`, which is the rotated
node's transform origin (corrected in plan iteration 3; the earlier dot value 580.842, 104.222 was
that origin and sat about 11.8 / 10.2 px off).

Card shadow: `0 4px 31px 0 rgba(55, 64, 78, 0.07)`. Card top equals digits bottom (330); the
tab top is card top − 29, inset 37 px on each side, and its bottom is hidden behind the card.

### 4.2 Digits per variant

Golos Bold (700), 244.5 px / 293.4 px, letter-spacing 0, shadow as a hard 4 px offset copy
(`text-shadow: 0 4px 0 <colour>`). The middle glyph sits 36 px lower; glyph boxes overlap by
6 px.

| Variant | Glyphs           | Fill                     | Shadow    | Glyph x (1/2/3) | Row width |
| ------- | ---------------- | ------------------------ | --------- | --------------- | --------- |
| 404     | `4` `0` `4`      | `#1EAEFF` (Primary)      | `#0E87CC` | 0 / 147 / 301   | 454       |
| 403     | `4` `0` `3`      | `#1B2327` (Dark primary) | `#999999` | 0 / 147 / 301   | 451       |
| 5xx     | `5` `x` `x` (lc) | `#FFC01E` (Secondary)    | `#CC9300` | 0 / 147 / 301   | 443       |

### 4.3 Card content and buttons (desktop)

Vertical rhythm for all three: top 29 → title 43 → gap 6 → description 26 → gap 24 → buttons 62
→ bottom 32 = 222. Children are centred horizontally.

| Element     | Style                                             |
| ----------- | ------------------------------------------------- |
| Title       | Golos DemiBold 600, 36 px, line box 43, `#000000` |
| Description | Golos Regular 400, 16 / 26, `#1A1C1E`, centred    |
| Button text | Golos DemiBold 600, 18 px, line box 22            |

| Button                           | Size   | Fill      | Border         | Radius | Padding | Label colour |
| -------------------------------- | ------ | --------- | -------------- | ------ | ------- | ------------ |
| Primary "На головну" (404, 5xx)  | 165x62 | `#1EAEFF` | none           | 57     | 20 / 32 | `#FFFFFF`    |
| Outlined "На головну" (403)      | 165x62 | `#FFFFFF` | 1 px `#969B9D` | 57     | 20 / 32 | `#1B2327`    |
| Primary "Запросити доступ" (403) | 228x62 | `#1EAEFF` | none           | 57     | 20 / 32 | `#FFFFFF`    |

The 403 action row is a horizontal auto-layout with an 8 px gap (401 wide, outlined first). No
hover, focus or pressed frames were provided; a `hover` token `#00A3FF` exists in the file
(**ESTIMATED** hover fill).

### 4.4 Tablet (404 only, 1024)

- Digits identical to desktop (244.5 px). Card 474x235; description Golos Regular **18 / 30**;
  button **189x70**, padding 20 / 44, fixed height. Rhythm: top 24 → title 43 → gap 4 →
  description 30 → gap 24 → button 70 → bottom 40.
- Tab 421x225 at card top − 29. Decorations x-stretched by 1.0185 (654.86 / 643), with offsets
  relative to the digits that differ from desktop.
- The card is **not centred** in the frame (card centre x 666 against the frame centre 512 and
  the content-column centre 637.5); the drawn layout leaves room for the out-of-scope sidebar.

### 4.5 Mobile (404 only, 375)

- Two scale factors: digits **0.6318** (154.462 px / 185.355 px, drop 22.742, shadow 2.527);
  card, tab, diamond and text effects **0.7391** (card 350.348x173.696, radius 11.826, border
  0.739 px, shadow 0 2.957 22.913).
- Card content: title Golos **Bold 700, 22**; description Golos Regular 15 / 25; button 132x50,
  padding 16 / 24, label Golos **Medium 500, 15 / 18**. Rhythm: 26.48 → 26 → 3.74 → 25 → 16 → 50
  → 26.48.
- The four vertical dot columns and the dot are drawn **off-canvas** (invisible). Instead four
  **horizontal** dot rows (the same unscaled assets rotated 90°, Ø 6.72, 10 / 8 / 6 / 4 dots,
  inverted pyramid) sit 19.78 px below the card (first row top at O-relative y 437.387, the
  rows spanning 59.09 px), centred.
- The curve is the desktop dash list scaled (0.559876, 0.560224) to 360x200 at x 15.
- Everything is centred horizontally in 375.

### 4.6 Placement of the composition in the page

| Frame       | Digits top below the content top | Gap to footer         | Horizontal centring        |
| ----------- | -------------------------------- | --------------------- | -------------------------- |
| 404 desktop | 95                               | 164                   | content column 250…1440    |
| 403 desktop | 139                              | 121                   | content column             |
| 5xx desktop | **76**                           | 184                   | full 1440 width            |
| 404 tablet  | **76**                           | 535 (card → footer)   | not centred (sidebar room) |
| 404 mobile  | 43.61                            | 73.91 (rows → footer) | centred in 375             |

> Assumption: with the header and sidebar out of scope, the composition is centred horizontally
> in the page body at every breakpoint, and one offset replaces the per-frame values above: the
> digits sit 76 px below the top of the content area on desktop and tablet for all three
> variants (the value the 5xx desktop and 404 tablet frames use; the 95 px and 139 px of the 404
> and 403 desktop frames are not reproduced) and 43.61 px on mobile. The pixel comparison is made
> per element against the composition-relative numbers, not against absolute frame coordinates.

### 4.7 Discrepancies inside the design

1. 5xx copy is placeholder (English title in a uk frame; the body copies the 403 text). Resolved
   by the binding copy in section 1.
2. 403 body typo "Нажаль" (section 1 assumption).
3. The 403 diamond and dot are frame-level nodes left at the 5xx coordinates, (−125, −63) away
   from where 404 and 5xx place them relative to the digits.
   > Assumption: 403 uses the 404 / 5xx relative placement of the diamond and the dot.
4. Frame heights differ (1000 against 940), and in 403 / 5xx 59 px of the footer is clipped by
   the frame. The footer itself is the existing component either way.
5. The decoration colours `#01A6FF` (diamond), `#00A3FF` (curve), `#0B315E` (dot) and the title
   `#000000` are not file variables. `#00A3FF` equals the existing `paletteColors.primary.hover`.
6. The desktop digit row is left-aligned in its 466 frame, so the visible digits sit 6 px (404),
   7.5 px (403) and 11.5 px (5xx) left of the frame centre. Reproduce the offset, not a centred
   row.

## 5. Reuse candidates

| Candidate                                                | Reuse verdict                                                                                                                                                                                                                                                                   |
| -------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `UIFooter` (local)                                       | Reuse unchanged. It matches the footer instances; keep it off the eager path (it imports `@/styles/theme`).                                                                                                                                                                     |
| `footer-loader.ts` pattern                               | Reuse as the model for a lazy, themed error-page loader used by `RouteError`.                                                                                                                                                                                                   |
| `UIButton` (local)                                       | Partial. Contained = `#1EAEFF` and radius 57 px, but padding, uppercase transform and type scale differ; outlined is radius 12 px with a `#E1E7EA` border. Needs `sx` overrides (precedent: `src/features/home/styles.ts` sign-out pill). `to` renders a full-navigation `<a>`. |
| `UITypography` (toolkit seam)                            | Usable with `sx`; custom variants do not resolve from the app theme with `inheritTheme`.                                                                                                                                                                                        |
| `UIContainer` (toolkit seam)                             | Optional for gutters; the composition is a fixed-width centred block.                                                                                                                                                                                                           |
| `UIBackToMain`                                           | Not in the design; drop it from the 404 page.                                                                                                                                                                                                                                   |
| `ErrorFallback` / `ErrorFallbackStyles`                  | Keep for non-status errors. Its focus-on-mount heading, `landmark` prop and `lang` handling are the model.                                                                                                                                                                      |
| `useFocusOnMount`, `usePageTitle`                        | Reuse for the focused `<h1>` and the document title.                                                                                                                                                                                                                            |
| `FallbackLandmark` type                                  | Reuse so the page renders `main` or a labelled `region` inside `AppLayout`.                                                                                                                                                                                                     |
| `ThemedChunkLoader`, `ChunkRetryLoader`, `RouteFallback` | Reuse for the lazy page inside `RouteError`.                                                                                                                                                                                                                                    |
| Colours in `src/styles/colors.ts`                        | `#1EAEFF`, `#00A3FF`, `#FFC01E`, `#1B2327`, `#1A1C1E`, `#969B9D`, `#EAECEE`, `#E1E7EA` exist. Missing: `#0E87CC`, `#CC9300`, `#999999`, `#01A6FF`, `#0B315E`, `#37404E`, `#FBFBFB` (the last is only in the orphan `ui-color-theme`).                                           |
| ui-toolkit `ui-error-boundary`, `ui-footer`, `ui-button` | Not adopted, by the deliberate ADR-016 rows (R7, R13, R16); do not adopt them here.                                                                                                                                                                                             |

## 6. Constraints that bind new code

- **Code shape (non-React `.ts`).** No free functions, no `static`, no function-valued
  object-literal properties; instance methods on a class exported as a singleton. Class names
  need an approved suffix from `config/class-naming-policy.js` (`ErrorPageStyles`,
  `ErrorPageStatusDetector`, `ErrorPageLoader`). A new suffix means editing the policy file and
  the CLAUDE.md table in the same change.
- **Types** only in type-only files (`src/components/types/error-page/…`), imported with
  `import type`.
- **Components.** No `new PascalCase()` in `.tsx` (component DI gate); instantiate in a `.ts`
  file and default-export the instance. No `data-testid`. A component must not value-import a
  `*-mapper.ts` / `*-factory.ts` file (`components-no-direct-injectable-import`), so the
  status-to-variant class is a `*Detector` or a plain data map.
- **Placement.** `src/components/error-page/` (component, `styles.ts`, `i18n/`, assets) is
  unconstrained by `config/module-shape.json` apart from lowercase paths and the
  `src/components` import rules (no `src/modules/**`). A module placement is wrong: these are
  app-shell pages, like `not-found`.
- **rust-code-analysis.** Per file: functions ≤ 10, closures ≤ 6; per function: exits ≤ 3,
  LLOC ≤ 10, cyclomatic ≤ 10, Halstead volume ≤ 1000; per class: NPM ≤ 8. `RouteError` is already
  dense, so the status branch belongs in a separate component or detector. Large inline SVG JSX
  inflates Halstead and PLOC, so art is imported as assets.
- **Coverage** is 100 / 100 / 100 / 100 over `src/**`; file-level `styles.ts` is in scope (only
  `styles/` directories are excluded), and the exclusion list is ratchet-guarded.
- **Mutation** break is 100, and `src/components/**`, `src/routes/**` and file-level `styles.ts`
  are mutated. Every new src file needs a **direct** test; module-scope literals (style tokens,
  the variant map) must be loaded inside the test (`tests/unit/utils/isolated-module.ts`).
- **i18n.** One owner per key, en/uk parity, no empty values; `*Key`-named literals are scanned
  and must resolve in both locales. `src/i18n/localization.json` is eager and committed, so new
  strings add eager bytes and need `make i18n-generate`.
- **Markdown.** `specs/**/planning-artifacts/` is excluded from markdownlint but not from
  Prettier.

## 7. Gate obligations

| Gate                                             | What this change must do                                                                                                                                                                                                                                                                                                                                  |
| ------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ESLint (`make lint-eslint`)                      | Class-only `.ts`, naming suffixes, type-only files, no `data-testid`, `<Suspense fallback={<RouteFallback />}>` for the lazy page, routes as data in `app-routes.ts`, explicit return types and member accessibility, decorative SVG `aria-hidden`, the inert action as `<button type="button">`, no disable directives.                                  |
| dependency-cruiser (`make lint-deps`)            | No orphans, no `src/modules` import from `src/components`, no DI bridge in `src/routes`, no cycles.                                                                                                                                                                                                                                                       |
| jscpd (`make lint-dup`)                          | `minTokens` **70**, threshold 0: one `ErrorPage` fed three configs; shared button style base plus overrides.                                                                                                                                                                                                                                              |
| rust-code-analysis (`make lint-metrics`)         | One component per file; status branch outside `RouteError`; art as assets.                                                                                                                                                                                                                                                                                |
| i18n (`make lint-i18n`)                          | New namespace or changed `not_found.*` values; keep `route_fallback.loading`; regenerate the merged catalog.                                                                                                                                                                                                                                              |
| Route coverage (`make check-e2e-route-coverage`) | Add `forbidden: '/forbidden'` and `serverError: '/server-error'` to `ROUTE_PATHS` and e2e, visual and a11y rows to `tests/e2e/route-coverage.tsv`. A registered route cannot have an `allowlisted` row.                                                                                                                                                   |
| Unit / coverage / mutation                       | Direct tests per file; status boundary tests (400, 401, 403, 404, 499, 500, 599, 600, non-response); rewrite the two `route-error.test.tsx` cases that pin the old 404 → navigate-home and 503 → retry behaviour; extend `route-paths`, `routes`, `registry` and `app-routes` tests; rework `not-found.test.tsx`; mock every SVG (no global Jest mapper). |
| Tooling pins                                     | `performance-serving.test.ts` pins the `not-found` `webpackChunkName` import path and requires the only eager `@mui/*` edge to stay `app-providers.tsx`; pin the new chunk names.                                                                                                                                                                         |
| Console gate                                     | Await the lazy page (`findBy…`); assert `onCaughtError` per test when a route throws; never a file-wide spy.                                                                                                                                                                                                                                              |
| jest-axe (component lane)                        | Add the three variants to `tests/unit/a11y/ui-components.a11y.test.tsx`.                                                                                                                                                                                                                                                                                  |
| Playwright a11y (route lane)                     | Add `forbidden` and `serverError` to `routeScans`; every scanned page must render the footer (`contentinfo`).                                                                                                                                                                                                                                             |
| Visual (`make test-visual`)                      | Add `PAGES.FORBIDDEN` / `PAGES.SERVER_ERROR` and a screens set covering 1440 / 1024 / 375; regenerate the six not-found baselines; baselines only from the pinned Playwright container or the CI artifact.                                                                                                                                                |
| E2E                                              | Specs import `test` from `@tests/e2e/utils/fixtures` (zero console tolerance); assert h1 via `t()`, home `href="/"`, and that "Запросити доступ" changes nothing.                                                                                                                                                                                         |
| Docs                                             | `src/routes/README.md` (app-routes "home + 404"), CLAUDE.md / AGENTS.md / copilot instructions pattern 14, `docs/accessibility/acceptance-standard.md` if an exception lands, an ADR-007 amendment or a new ADR for the 5xx behaviour change.                                                                                                             |
| ADR drift (PR-only)                              | Triggered only by `registry.ts`, `route-composer.tsx`, `src/config/**`, `rsbuild.config.ts` and similar. New routes go into the existing `app.shell` contract, so neither file needs to change.                                                                                                                                                           |
| Commitlint / Husky                               | `feat(#309): …` headers ≤ 100; the pre-commit hook runs the full suite and `git add -A`.                                                                                                                                                                                                                                                                  |

## 8. Risks

### 8.1 Eager-bundle growth through `RouteError` (high)

`RouteError` is eager, and the eager graph must stay MUI-free: `performance-serving.test.ts`
allows exactly one eager `@mui/*` edge. A page using `UIButton`, `UITypography` or `UIFooter`
imported statically from `RouteError` fails that test and grows the eager raw entrypoint.

- Headroom: the 3.4 kB figure from 2026-09-28 is stale. After ADR-017 the PR #306 bundle report
  showed the gzip initial entrypoint at about 138.7 KB of 161.1 KB (165 000 B), and #307 measured
  the raw eager entrypoint at about 430 kB of 470 kB. These are reported figures, not
  re-measured here (builds are CI-only).
- Mitigation: `RouteError` reaches the status page only through a lazy loader built like
  `footer-loader.ts` (`ThemedChunkLoader` + `ChunkRetryLoader`, `webpackChunkName:
"error-page"`), rendered under `<Suspense fallback={<RouteFallback />}>`. The status detector
  that decides between the page and `ErrorFallback` must be tiny and MUI-free, because it stays
  eager. New catalog strings still add eager bytes through `localization.json`.

### 8.2 Contrast of white on `#1EAEFF` (high for `/forbidden`)

Measured with the WCAG relative-luminance formula on 2026-10-01:

| Pair                                    | Ratio        | Verdict                                                           |
| --------------------------------------- | ------------ | ----------------------------------------------------------------- |
| `#FFFFFF` on `#1EAEFF` (labels)         | 2.46:1       | Fails 1.4.3; 18 px at 600 is not large text (needs 18.66 px bold) |
| `#969B9D` border on `#FFFFFF`           | 2.81:1       | Below the 1.4.11 3:1 floor; axe does not test borders             |
| `#1B2327` on `#FFFFFF` (outlined label) | 15.95:1      | Passes                                                            |
| `#000000` / `#1A1C1E` on white (text)   | 21 / 17.09:1 | Passes                                                            |
| `#1EAEFF` digits on `#FBFBFB`           | 2.37:1       | Decorative; must be `aria-hidden`                                 |
| `#FFC01E` digits on `#FBFBFB`           | 1.58:1       | Decorative; must be `aria-hidden`                                 |

- The route axe lane runs on every route in chromium, firefox and webkit, so a white-on-primary
  button on `/forbidden`, `/server-error` and the 404 page fails it as designed.
- Precedent: the auth submit button keeps white on `#1EAEFF` through one **scoped**
  `A11Y_EXCEPTIONS` entry (`form button[type="submit"].MuiButton-contained`, tracked in #276).
  Any new entry needs all four fields and a stable, non-wildcard selector, and the "Current
  exceptions" count in the acceptance standard must be updated.
- Selector trap: the existing back-to-main exception
  (`a[href="/"].MuiButton-root > span.MuiTypography-root`) would silently exempt a new home link
  that wraps its label in a `UITypography` span. Render button labels without that span, or make
  sure they pass on their own.
- The outlined button has no visible focus style in the `UIButton` theme (2.4.7); add a
  `:focus-visible` outline.

> Assumption: the primary buttons keep the design's white on `#1EAEFF` under one scoped
> `A11Y_EXCEPTIONS` entry tracked by #276, following the submit-button precedent. The deviation
> is flagged in the PR.

### 8.3 Behaviour change for 5xx route responses (medium)

Rendering the 5xx page for a 5xx route response replaces `ErrorFallback`'s in-place **Try
again** with a home button only. That changes the reliability model in ADR-007 / ADR-009
(pattern 14), whose decision text then describes behaviour that no longer exists. No CI gate
forces an ADR for it.

> Assumption: ADR-007 is amended (or a new ADR is added) to record that 403, 404 and 5xx route
> responses render the status pages, and the lost in-place retry is flagged in the PR.

### 8.4 SVG asset sourcing and size (medium)

- The dashed curve is **pre-outlined** in Figma: one 204 356-character path of 243 filled
  capsules (about 200 kB). Shipping it raw is not advisable. The Figma note captured each dash's
  end-points, so the curve can be rebuilt as one stroked path of 243 `M…L…` pairs (about 7 kB),
  `stroke-width 1.5`, butt caps (the end-points already include the round caps). Tablet and
  mobile curves are pure scalings of the same list. **ESTIMATED** alternative: a centreline with
  `stroke-dasharray "3.05 4.35"`; no centreline was extracted, so the end-point rebuild is the
  faithful option.
- The diamond, dot and dot-column SVGs were captured verbatim; each dot column can also be
  rebuilt as `<circle r="3.36">` elements at the listed tops (error < 0.03 px).
- Assets must be committed under the repo (CSP `img-src 'self' data:`); the Figma MCP URLs expire
  on 2026-10-08 and are off-origin.
- svgr: the default import is a URL and the named `ReactComponent` is an inline component that
  costs JS bytes. Jest has no global SVG mapper, so each test mocks the file. Storybook has no
  svgr loader, so a named `ReactComponent` import is `undefined` there.
- The repo has no 404 / 403 / 5xx illustration today; the existing notification SVGs (86–94 KB)
  show how heavy unoptimised art gets.

### 8.5 Font availability (low)

`src/styles/fonts.css` is eager and declares Golos 400, 500, 600, 700, 800, 900 and Inter 400,
500, 700; `src/assets/fonts/golos/` ships `golos-text-semi-bold.woff2` (600) and
`golos-text-bold.woff2` (700). Every weight the design uses (Regular 400, Medium 500, DemiBold
600, Bold 700) maps to an existing `@font-face`, all same-origin under CSP `font-src 'self'`. The
risk is a visual-test race on the 244.5 px digits: the visual helpers already wait for
`document.fonts.status === 'loaded'`, which covers it. The `UIButton` theme uses
`'Golos, Inter'` and the app theme `'Golos, sans-serif'`; the page must pin Golos explicitly.

### 8.6 Theme outside a mapped page (medium)

A status page rendered by `RouteError` sits outside any page `ThemeProvider` (ADR-017). Rendered
through `ThemedChunkLoader` it gets the CRM theme; rendered any other way, MUI components fall
back to the default theme (wrong font, radius, palette) and visual diffs follow.

### 8.7 Visual baselines and pixel parity (medium)

- None of the existing visual sizes matches the frames (`desktop` 1536x864, `mobile` 393x873 for
  the not-found spec; `desktop2` is 1440x900, `mobile4` 375x812). Pixel comparison against Figma
  needs 1440, 1024 and 375 widths.
- The six existing not-found baselines will diff and must be regenerated from the pinned
  Playwright container or the CI artifact; a reused prod container (`--no-recreate`) silently
  serves stale code.
- The page background `#FBFBFB` differs from `body` `#fff`; the page must paint it.
- Tablet card placement in the design is off-centre (section 4.4); the centring assumption
  (section 4.6) must be stated to the Fable reviewer, or it will be reported as a defect.

### 8.8 Other risks

- **memlab.** `tests/memory-leak/tests/home.js` and `auth-skeleton.js` use `/__memlab_away__`,
  an unknown path, i.e. the 404 page, as the away page. A heavier 404 or one that leaks detached
  nodes affects those scenarios.
- **E2E not-found spec** asserts one `main a[href="/"]` with `not_found.cta` text and the
  `not_found.title` h1; it must be rewritten for the new copy and button.
- **`UIButton to`** renders a full-document `<a>`, not a router `Link`; the home click reloads
  the shell. That matches today's not-found page and `ErrorFallback` (plain anchor), so it is
  acceptable, and it is the only safe navigation from a crashed route tree.
- **Lighthouse** audits only `/`, `/sign-up` and `/sign-in`; `lighthouse/constants.js` is pinned
  by a test and listed in the gate-ratchet manifest.

> Assumption (superseded downstream): this note first kept `/forbidden` and `/server-error` out
> of Lighthouse. The PRD (NFR-12) and the epics (Story 3.4) add them, because the product owner
> made the routes "reachable by E2E/visual/Lighthouse" and the acceptance standard asks it of
> user-facing routes; `notFound` stays out because `'*'` has no stable URL.

## 9. Testing surface that must change

- Unit: `tests/unit/components/not-found/not-found.test.tsx`;
  `tests/unit/components/error-boundary/route-error.test.tsx` (navigate-home with 404 and retry
  with 503 cases) and `route-error.router.test.tsx`; `tests/unit/lib/reliability/
recovery-strategy-detector*.test.ts` only if the detector changes; `tests/unit/routes/
{routes,route-composer,registry,route-paths}.test.*`; app-level mocks in `app.test.tsx`,
  `app-root.test.tsx`, `app.router-wiring.test.tsx`; `tests/unit/a11y/ui-components.a11y.test.tsx`;
  `tests/unit/tooling/performance-serving.test.ts`.
- E2E: `tests/e2e/modules/not-found.spec.ts`, new error-page specs,
  `tests/e2e/a11y/routes.a11y.spec.ts`, `tests/e2e/route-coverage.tsv`.
- Visual: `tests/visual/visual-comparison.not-found.spec.ts`, `tests/visual/constants.ts`, new
  specs and baselines for chromium, firefox and webkit.
- Optional: the mobile lane's 44 px touch-target helper could cover the error-page buttons (the
  designed buttons are 50–70 px tall).

## 10. Reconciled discrepancies between the inputs

| Topic                | Notes disagreed                                      | Resolution                                                                                       |
| -------------------- | ---------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| jscpd `minTokens`    | CLAUDE.md says 75; the gates note says 70            | `.jscpd.json` reads **70** (jscpd 5, #307). CLAUDE.md is stale.                                  |
| White on `#1EAEFF`   | 2.45:1 (gates note) vs 2.46:1 (repo palette comment) | **2.46:1** recomputed; fails 4.5:1 either way.                                                   |
| Eager headroom       | ~3.4 kB (task memo, 2026-09-28) vs ~40 kB raw        | ~40 kB raw / ~22 KB gzip after ADR-017 (reported, not re-measured). The rule stays: art is lazy. |
| Tablet card centring | Figma off-centre vs "centred" pages elsewhere        | Centred, by the section 4.6 assumption; sidebar is out of scope.                                 |
| 403 diamond and dot  | Frame-level at 5xx coordinates                       | 404 / 5xx relative placement (section 4.7 assumption).                                           |

## 11. Open items and follow-ups

- **TODO (tracked here and in the PR, not in code):** wire "Запросити доступ" to an
  access-request flow when one exists (RBAC #114).
- Design confirmation: the 5xx copy, the "На жаль" orthography, white-on-primary contrast, the
  outlined button border contrast, and the tablet off-centre card.
- Hover, focus and pressed states have no frames; the plan uses the `hover` token `#00A3FF` and
  a visible `:focus-visible` outline.
- en strings for the 404 / 403 bodies need wording: "Page does not exist" / "Unfortunately, you
  do not have permission to access this page" are the candidate translations.

> Assumption: en copy is 404 "Error 404" / "This page does not exist", 403 "Access denied" /
> "Unfortunately, you do not have permission to access this page", buttons "Go to homepage" and
> "Request access"; the PRD may refine the wording.

## 12. Recommended direction for the brief

- One shared presentational `ErrorPage` in `src/components/error-page/` driven by a per-status
  configuration (digits, colours, title key, body key, actions), with its decoration layer as
  committed, optimised SVG assets and its styles in an `ErrorPageStyles` singleton.
- Three thin entries: the reworked 404 page in place (keeping the `not-found` chunk name and
  import path pinned by `performance-serving.test.ts`), plus `forbidden` and `server-error`
  pages registered in the existing `app.shell` contract under new `ROUTE_PATHS` keys.
- `RouteError` delegates to a small MUI-free status detector: 403, 404 and 5xx route responses
  render the lazy, themed status page (`landmark` forwarded); everything else keeps
  `ErrorFallback`.
- The existing `UIFooter` below the composition, a `#FBFBFB` page background, a focused `<h1>`,
  `aria-hidden` digits and art, and two scoped contrast exceptions (primary actions and the
  decorative digits; see architecture §8.4 and §10.4).
- Verification: focused Jest, ESLint, Prettier, `tsc`, `make lint-i18n`,
  `make check-e2e-route-coverage` and the cheap Docker linters locally; e2e, visual, a11y-e2e,
  mutation, bundle size and Lighthouse in CI; then the Fable pixel review against section 4.
