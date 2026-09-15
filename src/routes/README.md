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

| File                    | Responsibility                                                |
| ----------------------- | ------------------------------------------------------------- |
| `types/app-route.ts`    | `AppRouteObject` (path/index, lazy `load`, `guard`, `meta`)   |
| `types/route-module.ts` | `RouteModule` (`id` + `routes`) — a module's contract shape   |
| `app-routes.ts`         | The app shell's own contract (home + 404)                     |
| `registry.ts`           | Collects every module contract into one list                  |
| `route-validator.ts`    | Rejects duplicate module ids / routes with no path or index   |
| `route-mapper.tsx`      | Maps one contract route → a lazy route with an `errorElement` |
| `route-composer.tsx`    | Validates, partitions by guard, assembles the tree, `onError` |
| `route-paths.ts`        | Canonical URL constants — one key per route, read by the gate |
| `routes.tsx`            | Wiring only: `createBrowserRouter(...)` + `onRouteError`      |

The composer, mapper, and validator are container-free **module singletons**
(`export default new X()`), so no tsyringe is pulled into the auth page's paint
path (mobile Lighthouse budget).

## The contract

```ts
// src/routes/types/app-route.ts — a discriminated union: exactly one of index | path
interface RouteCommon {
  readonly load: () => Promise<{ default: ComponentType }>; // per-route code split
  readonly guard?: 'protected' | 'public'; // top-level only; resolved by the composer
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

## Errors and fallbacks (issue #116)

Every route object the composer emits — the root route, the two layout routes of
the protected branch (`ProtectedRoute`, `AppLayout`), and every mapped page —
carries `errorElement: <RouteError landmark=… />`, so a page that throws is
caught by its own route and the surrounding layout survives. The `landmark`
follows the tree: pages under `AppLayout` render the fallback as an
`aria-labelledby` `<section>` (`'region'`), because `AppLayout` already owns
the page's `<main>` and two would nest; open routes and the layouts render
`<main>`. `RouteError` is presentational — it classifies `useRouteError()`
with `recoveryStrategyDetector`, its **Try again** re-navigates to the current
location so the route really re-renders, and the fallback always offers a
homepage link. Reporting lives at the router seam:
`routeComposer.routeErrorHandler()` builds the callback that `routes.tsx`
exports as `onRouteError` and `src/app.tsx` passes to
`<RouterProvider onError>`; it reports through the container-free
`boundaryErrorReporter` with `surface: 'route'`, so the shell never touches the
DI container. Suspense fallbacks are `<RouteFallback />`, never `null` — see
"Route-level splitting" and pattern 14 in `CLAUDE.md`, and ADR-007.

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
