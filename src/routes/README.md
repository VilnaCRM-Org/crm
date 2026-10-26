# Route registry

Routing in this CRM is **module-owned data**, not a hand-edited tree in the app
shell. Each module/feature declares its routes through a small typed **public
route contract**; a registry collects the contracts and a composer assembles the
`createBrowserRouter` tree. Adding a page touches only the owning module — never
`routes.tsx` or the composer (issue #105).

## Why

A 50+ page CRM built by many parallel human and AI contributors cannot route
through one shared file. A single `createBrowserRouter([...])` literal is a
merge-conflict hotspot and a central coupling node that reaches across every
module boundary. Module-owned contracts give each page a bounded blast radius,
keep a feature's URLs/guards/lazy chunks colocated with the feature, and make the
route set discoverable (audit, nav, sitemap).

## Files

| File                    | Responsibility                                                 |
| ----------------------- | -------------------------------------------------------------- |
| `types/app-route.ts`    | `AppRouteObject` (path/index, lazy `load`, `guard`, `flag`)    |
| `types/route-module.ts` | `RouteModule` (`id` + `routes`) — a module's contract shape    |
| `types/shell-slot.ts`   | `RouteModuleShell` (`userMenu` loader), slot props, `onAvatar` |
| `app-routes.ts`         | Shell contract: home, five coming-soon routes, 404, 403, 5xx   |
| `shell-slot-factory.ts` | Wraps `shell.userMenu` in a lazy, retrying slot component      |
| `registry.ts`           | Collects every module contract into one list                   |
| `route-validator.ts`    | Rejects duplicate module ids / routes with no path or index    |
| `route-mapper.tsx`      | Maps one contract route → a lazy route with an `errorElement`  |
| `route-composer.tsx`    | Validates, partitions by guard, assembles the tree, `onError`  |
| `route-flag-gate.tsx`   | Renders the not-found page while a matched route's flag is off |
| `route-paths.ts`        | Canonical URL constants — one key per route, read by the gate  |
| `routes.tsx`            | Wiring only: `createBrowserRouter(...)` + `onRouteError`       |

The composer, mapper, and validator are container-free **module singletons**
(`export default new X()`), so no tsyringe is pulled into the auth page's paint
path (mobile Lighthouse budget).

The mapper does not hand `route.load` to `React.lazy` bare (issue #147):
every page loader is wrapped in a `ChunkRetryLoader`, which re-imports once when the
chunk fails to load, and a **public** route's loader is further wrapped in a
`ReloadingChunkLoader`, which reloads the document once per session (a
`sessionStorage` flag keyed by the route path) when the retry also fails. A
protected route never auto-reloads — the auth token is memory-only — so its second
failure reaches the route `errorElement` and its **Reload the page** button.

## Registered routes

| Key                    | Path                     | Contract                   | Guard     |
| ---------------------- | ------------------------ | -------------------------- | --------- |
| `home`                 | `/` (index)              | `app-routes.ts`            | protected |
| `signUp`               | `/sign-up`               | `@auth/routes` (user.auth) | public    |
| `signIn`               | `/sign-in`               | `@auth/routes` (user.auth) | public    |
| `passwordRecovery`     | `/password-recovery`     | `@auth/routes` (user.auth) | public    |
| `passwordReset`        | `/password-reset`        | `@auth/routes` (user.auth) | public    |
| `settings`             | `/settings`              | settings routes            | protected |
| `forbidden`            | `/forbidden`             | `app-routes.ts`            | public    |
| `serverError`          | `/server-error`          | `app-routes.ts`            | public    |
| `boards`               | `/boards`                | `app-routes.ts`            | protected |
| `products`             | `/products`              | `app-routes.ts`            | protected |
| `orders`               | `/orders`                | `app-routes.ts`            | protected |
| `contacts`             | `/contacts`              | `app-routes.ts`            | protected |
| `analytics`            | `/analytics`             | `app-routes.ts`            | protected |
| `settingsIntegrations` | `/settings/integrations` | settings routes            | protected |
| `settingsWebhooks`     | `/settings/webhooks`     | settings routes            | protected |
| `settingsBilling`      | `/settings/billing`      | settings routes            | protected |
| `notFound`             | `*`                      | `app-routes.ts`            | public    |

`/settings` (issue #330) and the three `/settings/…` coming-soon routes are the flagged routes:
`flag: 'userSettings'`, so each renders the not-found page while the flag is off (see "Flagged
routes"). Their contract is `src/modules/user/features/settings/routes/index.ts`; `/settings`
renders the lazy `settings` chunk.

## Coming-soon routes (issue #362)

The eight planned sections (`boards`, `products`, `orders`, `contacts`, `analytics`,
`settingsIntegrations`, `settingsWebhooks`, `settingsBilling`) are protected routes whose loaders
all `import(/* webpackChunkName: "coming-soon" */ '@/components/coming-soon')`, so Rspack emits
one shared chunk. `ComingSoonPage` finds its section from the pathname in the typed
`comingSoonSections` list, so no contract passes the section down. The five product routes are
shell-owned in `app-routes.ts` until their modules exist; each then moves to that module's
contract with the same path and the same key. The three settings routes sit in the settings
contract beside `/settings` so the flag gate covers them with no composer change.

`/password-recovery` and `/password-reset` (issue #315) render the `ResetPassword` and
`CreateNewPassword` pages; signed-in users are not redirected away from either.

## Shell slots (issue #362)

A module may put one piece of its UI into the app shell without the shell importing the module.
`RouteModule.shell` is an optional `RouteModuleShell`; today it carries `userMenu`, a loader of a
component that takes `signOut`, an `onChunkFailure` callback and an `onAvatar` callback
(`ShellSlotProps`). The settings contract declares it
(`webpackChunkName: "user-menu"`). `RouteComposer` finds the one module that declares it and hands
`AppLayout` `routeMapper.shellSlot(load)`, a lazy component wrapped like a page chunk (one
re-import, the MUI theme shell loaded in parallel). `RouteValidator` rejects a registry in which
two modules declare `shell.userMenu`.

- **The avatar copy (`onAvatar`):** the host (`UIAppShell`) renders the slot with
  `ShellSlotHostProps` — `signOut` plus `onAvatar`, its own state setter — and the factory passes
  both through. The loaded slot calls `onAvatar` with an aria-hidden, non-focusable copy of the
  avatar it is showing, and with `null` when it unmounts; the shell hands that node to the mobile
  drawer, whose opaque header covers the header avatar. It is the slot's output, not a second slot:
  a second component reading the user would issue a second `currentUser` query (the read is
  `no-cache` and re-runs on every navigation) and flash the glyph before the monogram on every
  drawer open, and copying the user into a client store is what the state rules forbid. So the copy
  costs no request, no chunk and no new contract key. Before the slot loads, after its chunk fails
  twice, or without a declaring module, `onAvatar` is never called and the drawer keeps its 40 px
  `#E1E7EA` placeholder with the no-data glyph, the same size, so nothing shifts and nothing is
  announced.

- **Second failure of the slot chunk:** the slot frame stays empty and keeps its size, and the
  failure is captured with `source: 'app-shell:user-menu'`. The page and the rest of the shell
  are untouched and nothing reloads.
- **The current-user chunk** reports through the `onChunkFailure` callback the mapper binds
  (`source: 'app-shell:current-user'`); `AppLayout` reports the shell chunk with
  `routeMapper.chunkFailureReporter('app-shell:load')`.
- **Why the mapper captures:** a component under `src/components/` must not import
  `src/services/`, and a settings component must not either (`no-feature-ui-to-services`), so the
  route layer is the only place that reaches the observability boundary.
- **ADR drift:** `route-composer.tsx` changed, so the pull request carries the `adr:not-required`
  label; the decision lives here and in the shell README.

## The contract

```ts
// src/routes/types/app-route.ts — a discriminated union: exactly one of index | path
interface RouteCommon {
  readonly load: () => Promise<{ default: ComponentType }>; // per-route code split
  readonly guard?: 'protected' | 'public'; // top-level only; resolved by the composer
  readonly flag?: FeatureFlag; // top-level only; checked when the route renders
  readonly meta?: { titleKey?: string; permission?: string };
}
interface IndexRoute extends RouteCommon {
  readonly index: true; // a leaf — no path, no children
}
interface PathRoute extends RouteCommon {
  readonly path: string;
  readonly children?: readonly AppRouteObject[];
}
export type AppRouteObject = IndexRoute | PathRoute;
```

`guard: 'protected'` routes are nested under the `ProtectedRoute` guard and
`AppLayout`; everything else renders directly under `RootLayout`. The guard is
declarative data in the contract — it is never hand-wired in the shell. `guard`
applies to a module's **top-level** routes only; nested children inherit their
parent's protection context, so declaring a guard on a child is rejected by the
`RouteValidator` (it would otherwise render outside `ProtectedRoute`).

`AppLayout` is the shell chrome of every protected page (issues #106, #362). It is a CSS grid frame
that renders, in order, the lazy `UIAppShell` (header, sidebar from 1024 px or mobile drawer below
it, loaded through `appShellLoader` behind a `<Suspense>` whose fallback is two `aria-hidden`
size-holding placeholders, a header slot and a navigation column), the page's `<main>` and, after it
as a sibling, the shared `UIFooter`, so the footer keeps its `contentinfo` role and never sits
inside `<main>`. A shell chunk that still fails after its retry resolves to the same placeholders
and is reported through the `onShellFailure` callback the composer passes beside the optional
`userMenu` slot (see "Shell slots"). While it is mounted, `useHeaderClearance` (through
`useFrameFocus`) reserves the 64 px sticky header as `scroll-padding-top` on the document, so a
control that receives keyboard focus is never scrolled under the header (WCAG 2.4.11), the top
counterpart of the toast stack's `scroll-padding-bottom`. The footer is loaded lazily behind its
own `<Suspense>`,
because `AppLayout` is in the eager entrypoint and a static footer import would spend the remaining
raw entrypoint budget. Its fallback is an empty, `aria-hidden` box that only holds the footer's
height: the page is already usable, so the chrome shows no loader and announces nothing while its
chunk loads. The chunk comes through a `ChunkRetryLoader`
(`src/components/layouts/footer-loader.ts`, issue #147), and a load that still fails resolves to an
empty component: a missing footer never reaches the `AppLayout` `errorElement` and never replaces
the page. `AppLayout` also forwards `ProtectedRoute`'s outlet context (`ProtectedOutletContext`,
`{ signOut }`, from `src/routes/types/protected-outlet-context.ts`) to the page with
`<Outlet context={outletContext} />` — a bare `<Outlet />` resets the context to `undefined` in
react-router 7 — and hands the same `signOut` to the lazy app shell
(`<AppShell signOut={outletContext.signOut} userMenu={userMenu} />`), whose sidebar, drawer and user
menu are the sign-out controls (issue #362). The home page at `/` no longer reads the context.

## Flagged routes (issue #330)

A top-level route may declare `flag: <FeatureFlag>`, the runtime flag that switches it on (see
`docs/feature-flags.md`). The route is **always registered**: no flag is read while the router is
built. `src/routes/routes.tsx` builds the router at module evaluation, before `index.tsx`
validates the runtime configuration block, and a flag read parses that block and throws on
malformed JSON, which would skip the bootstrap error fallback. The flag is therefore resolved when
a matched route renders:

- `RouteMapper` copies `flag` into the route's `handle` (`RouteHandle`).
- When at least one route declares a flag, `RouteComposer` wraps the root's children in exactly one
  pathless `RouteFlagGate` route with its own `errorElement`, above the `ProtectedRoute` branch and
  the public pages. A registry with no flagged route gets no gate level and the tree is unchanged.
- `RouteFlagGate` reads `useMatches()` and `featureFlagService.isEnabled` during render. While a
  matched route's flag is off it renders the composer's own not-found element (the `error-page`
  chunk, loaded exactly as for an unknown path), so the flagged page element never renders and its
  chunk is never requested. Otherwise it renders its `Outlet`. The element is the one the composer
  already mapped for the public `*` route, not a second mapping, so a flag-off page and a real
  404 share one loader graph and one lazy component.
- Because the gate sits above `ProtectedRoute`, a flag-off protected page shows the not-found page
  to a visitor without a token too, with no redirect to `/sign-in`.
- `RouteValidator` rejects a flagged registry with no public route at `ROUTE_PATHS.notFound`
  ("A flagged route needs a registered public not-found route") and a nested route that declares
  `flag`, like a
  nested `guard`: `flag` is top-level only because the `RouteFlagGate` decides once per matched
  route, at render time.

The gate's prop is named `notFound`, not `fallback`, so the Suspense-fallback ESLint gate never has
to judge it. It imports neither tsyringe, `@/providers/di`, Apollo, zod nor `@mui/*`.

## Errors and fallbacks (issue #116)

Every route object the composer emits — the root route, the two layout routes of
the protected branch (`ProtectedRoute`, `AppLayout`), and every mapped page —
carries `errorElement: <RouteError landmark=… />`, so a page that throws is
caught by its own route and the surrounding layout survives. The `landmark`
follows the tree: pages under `AppLayout` render the fallback as an
`aria-labelledby` `<section>` (`'region'`), because `AppLayout` already owns
the page's `<main>` and two would nest; open routes and the layouts render
`<main>`. `RouteError` is presentational and dispatches on status first
(issue #309): `errorPageStatusDetector` reads a status from a router
error response, a render-thrown `Response` or a `data()` value, and maps 403,
404 and 500 to 599 to the designed `ErrorPage` (`@/components/error-page`),
which `RouteErrorPage` lazy-loads through `errorPageLoader` with the same
`landmark`. A 5xx route response therefore shows the 5xx page, whose only
action is the homepage link, and offers no in-place retry. Every other error
renders `RouteErrorFallback`, the previous body unchanged: it classifies
`useRouteError()` with `recoveryStrategyDetector`, its **Try again**
re-navigates to the current location so the route really re-renders, and the
fallback always offers a homepage link. When the error-page chunk still fails
after its retry, status errors render that fallback for the rest of the
session. The `*`, `/forbidden` and `/server-error` routes in `app-routes.ts`
deliberately share the `webpackChunkName: "error-page"` of `errorPageLoader`:
`PostLoadPrefetcher`, attached from `src/index.tsx`, loads that one chunk 2 s
after the first interaction on a loaded page, so every error page a navigation
then reaches renders with no network.
Do not give those routes their own chunk names; `performance-serving.test.ts`
pins the shared name. Reporting lives at the router seam:
`routeComposer.routeErrorHandler()` builds the callback that `routes.tsx`
exports as `onRouteError` and `src/app.tsx` passes to
`<RouterProvider onError>`; it reports through the container-free
`boundaryErrorReporter` with `surface: 'route'`, so the shell never touches the
DI container. Suspense fallbacks are `<RouteFallback />`, never `null` — see
"Route-level splitting" and pattern 14 in `CLAUDE.md`.

## Adding a page

1. **Existing module** — add a route object to that module's
   `features/<f>/routes/index.ts` contract:

   ```ts
   // src/modules/user/features/<f>/routes/index.ts
   const featureRoutes: RouteModule = {
     id: 'user.<f>',
     routes: [
       {
         path: ROUTE_PATHS.customers,
         guard: 'protected',
         load: () => import('./customers'), // own dynamic chunk
         meta: { titleKey: 'customers.title' },
       },
     ],
   };
   ```

2. **New module** — create its `routes/index.ts` contract, then append it (one
   line) to `src/routes/registry.ts`.

3. Add any new URL constant to `route-paths.ts`.

4. Add the route's browser-coverage rows to `tests/e2e/route-coverage.tsv`
   naming the spec(s) that exercise it. `make check-e2e-route-coverage` (first
   step of the `e2e testing` job) fails on a route key that has neither a
   covering spec nor an allowlist entry with a stated reason (issue #169).

Never edit `routes.tsx`, `route-composer.tsx`, or `route-mapper.tsx` to add a
page.

## Enforcement

- **dependency-cruiser** `no-routes-import-feature-internals` — the shell may
  reach a feature only through its `routes/index` contract barrel and the
  `protected-route` guard. Deep-importing a page (`@auth/routes/sign-up`) fails
  the gate. Verified by `tests/unit/tooling/route-registry-boundary.test.ts`.
- **ESLint** (`no-restricted-syntax`, `make lint-eslint`, issue #116) — a named
  `create{Browser,Hash,Memory}Router` import or an `import * as` from
  `react-router` anywhere in `src/` except `routes.tsx`, the single sanctioned
  construction site; inside `src/routes/**/*.tsx`, a route object literal with
  an `element` and no own `errorElement` (`:has(> …)`, so a child's does not
  satisfy its parent); and, everywhere, a `fallback={null|undefined|false|""}`
  or a `<Suspense>` with no `fallback`. Must-fail fixtures per selector live in
  `scripts/ci/eslint-gate-fixtures.mjs`. Honest limit: the shape selector sees
  object literals only, so the composer and mapper must keep building routes as
  literals.
- **Unit tests** — `tests/unit/routes/*` cover the composer (invariants A/B/D:
  single `RootLayout`, `protected`→`AppLayout`, public not; every route object
  in the composed tree carries a `RouteError` `errorElement` with the landmark
  its branch requires; `routeErrorHandler()` reports with `surface: 'route'`),
  the validator (duplicate id / unlocatable route), and the registry; per-route
  code splitting is asserted in `tests/unit/tooling/performance-serving.test.ts`.
- **Route coverage inventory** — `scripts/ci/check-e2e-route-coverage.ts` reads
  the route **keys** from `route-paths.ts` and reconciles them against
  `tests/e2e/route-coverage.tsv` in both directions (missing row, stale row,
  missing spec file, spec outside its suite root, allowlisted-and-covered, and
  an `allowlisted` row for a key some contract already binds to a `path:`).
  Fixtures in `tests/bats/ci_scripts.bats` pin every failure mode.

Never satisfy a gate with a suppression — route through the contract instead.
