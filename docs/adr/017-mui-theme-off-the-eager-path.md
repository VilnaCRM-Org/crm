# ADR-017: The MUI theme engine loads with the page chunk, not before first paint

- Status: Approved
- Deciders: [@kravalg](https://github.com/kravalg)
- Date: 2026-09-29

**Technical Story**: The Dependabot consolidation in
[#304](https://github.com/VilnaCRM-Org/crm/pull/304) raises React to 19.3, whose
`react-dom-client` is about 29 kB larger minified. The eager entrypoint measured 467.9 kB of the
470 kB `raw.maxInitialEntrypointBytes` budget before the bump and 485.4 KiB (497 kB) after it.

## Context and Problem Statement

The initial entrypoint carried the whole MUI theme engine: `ThemeProvider` and `CssBaseline` in
`src/providers/app-providers.tsx`, `createTheme()` in `src/styles/theme.ts`, and three `Box`
elements on the paint path (`RouteFallback`, `UILiveStatus`, `AppLayout`), each of which imports
`@mui/material/styles/defaultTheme` and so keeps `createTheme` eager on its own. An esbuild
reproduction of the eager import closure attributed about 65 kB raw of `@mui/*` to it. Nothing
painted before a page chunk arrives reads the theme: `RouteFallback`, `ErrorFallback` and
`RouteError` already style themselves with literal palette tokens through Emotion. The budget
could not absorb React 19.3, and raising it is a gate relaxation the ratchet (#188) exists to
stop.

## Decision Drivers

- The raw and gzip entrypoint budgets in `config/performance-budget.json` stay where they are.
- The page must not wait on a second round trip: a theme chunk requested only after a lazy
  wrapper resolves would serialize onto mobile LCP (Lighthouse floor 0.84).
- A failing theme chunk must follow the chunk-recovery policy of ADR-009 exactly as a page chunk
  does: retry once, reload once on a public route, never reload a protected one.
- Rendering, landmarks, focus handling and live regions stay as they are.

## Considered Options

1. **Load the theme with each page** — a lazy `mui-theme` chunk requested in parallel with every
   page chunk and the footer, and no MUI on the eager path.
2. **Wrap the router in a lazy theme root** — one lazy `ThemeProvider` around `<App />` or the
   root layout's outlet.
3. **Defer i18next and the localization catalog** instead.
4. **Raise `raw.maxInitialEntrypointBytes`** with the `gate-relaxation` label.

## Decision Outcome

Chosen option: **"Load the theme with each page"**, because it frees the most bytes (about
67 kB raw by the esbuild reproduction) without adding a round trip or touching a budget.

- `CssBaseline`'s rules for this theme are static CSS in `src/index.css`; the rules
  `index.css` already overrode (margin, font family and size, box sizing) are left out, and
  `letter-spacing` never applied because the theme's font family is not MUI's default.
- `RouteFallback`, `UILiveStatus` and `AppLayout` render `@emotion/styled` elements instead of
  `Box`, so no eager module imports the MUI default theme.
- `src/providers/mui-theme/` holds `MuiThemeShell` (the `ThemeProvider`), its
  `muiThemeShellLoader` (a `ChunkRetryLoader` over a `webpackChunkName: "mui-theme"` import),
  and `ThemedChunkLoader`, which resolves a content loader and the shell loader with one
  `Promise.all` and renders the content inside the shell.
- `RouteMapper` wraps every page loader, and `footer-loader.ts` the footer loader, in a
  `ThemedChunkLoader`; `ReloadingChunkLoader` now accepts any `ModuleLoader`
  (`src/lib/reliability/types/module-loader.ts`), so a public route's theme chunk gets the same
  reload-once recovery as its page chunk.
- `AppProviders` keeps only `StyledEngineProvider injectFirst`, the i18n provider and the
  route-level Suspense, and `tests/unit/tooling/performance-serving.test.ts` pins the eager files
  free of other MUI imports.

## Positive Consequences

- The eager entrypoint drops below its pre-bump size with React 19.3 included, leaving headroom
  under both entrypoint budgets.
- The eager JavaScript finishes about 22 kB of gzip sooner, so the page and theme requests start
  earlier.

## Negative Consequences

- Every lazy page and the footer render inside their own `ThemeProvider` over the same theme
  object; a new surface rendered outside a mapped page must be wrapped the same way or it falls
  back to MUI's default theme.
- The static `index.css` baseline mirrors `theme.palette` values (`rgba(0, 0, 0, 0.87)` text on
  `#FFFFFF`) by hand and must move with the palette.
- The app-level error fallback, rendered outside `AppProviders`, now always gets the body
  baseline (line height 1.5, text color, font smoothing); before, it lost `CssBaseline` when the
  providers unmounted.

## Pros and Cons of the Options

### Load the theme with each page

Parallel `mui-theme` chunk per lazy surface; the eager path keeps only `StyledEngineProvider`.

#### Good (Load the theme with each page)

- Largest saving, no extra round trip, the existing chunk-recovery policy covers the new chunk.

#### Bad (Load the theme with each page)

- One more async chunk and three new modules with their own tests.

### Wrap the router in a lazy theme root

A single lazy `ThemeProvider` above the routed content.

#### Good (Wrap the router in a lazy theme root)

- One wrapper instead of one per lazy surface.

#### Bad (Wrap the router in a lazy theme root)

- React requests the page chunk only after the theme chunk resolves: a serial round trip on
  every first load.

### Defer i18next and the localization catalog

Load `src/i18n.js` behind a dynamic import.

#### Good (Defer i18next and the localization catalog)

- About 58 kB raw.

#### Bad (Defer i18next and the localization catalog)

- `RouteFallback`, `ErrorFallback` and the bootstrap error need strings before first paint, so
  it only moves required bytes out of the metric.

### Raise the raw entrypoint budget

Accept the growth with the `gate-relaxation` label.

#### Good (Raise the raw entrypoint budget)

- No code change.

#### Bad (Raise the raw entrypoint budget)

- Spends the headroom the budget protects and ships 65 kB of theme code nothing on the first
  frame uses.

## Links

- [ADR-009: Runtime resilience](./009-runtime-resilience.md)
- [ADR-010: RSBuild is the bundler](./010-rsbuild-bundler.md)
- [Dependabot consolidation #304](https://github.com/VilnaCRM-Org/crm/pull/304)
