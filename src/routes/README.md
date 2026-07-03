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

| File                         | Responsibility                                              |
| ---------------------------- | ----------------------------------------------------------- |
| `types/app-route.ts`         | `AppRouteObject` (path/index, lazy `load`, `guard`, `meta`) |
| `types/route-module.ts`      | `RouteModule` (`id` + `routes`) — a module's contract shape |
| `app-routes.ts`              | The app shell's own contract (home + 404)                   |
| `registry.ts`                | Collects every module contract into one list                |
| `route-validator.ts`         | Rejects duplicate module ids / routes with no path or index |
| `route-mapper.tsx`           | Maps one contract route → a `react-router` route (lazy)     |
| `route-composer.tsx`         | Validates, partitions by guard, assembles the tree          |
| `route-paths.ts`             | Canonical URL constants (`home`, `signUp`, `signIn`, 404)   |
| `routes.tsx`                 | Wiring only: `createBrowserRouter(composer.compose(...))`   |

The composer, mapper, and validator are container-free **module singletons**
(`export default new X()`), so no tsyringe is pulled into the auth page's paint
path (mobile Lighthouse budget).

## The contract

```ts
// src/routes/types/app-route.ts
export interface AppRouteObject {
  readonly path?: string; // omit for an index route
  readonly index?: boolean;
  readonly load: () => Promise<{ default: ComponentType }>; // per-route code split
  readonly guard?: 'protected' | 'public'; // resolved by the composer
  readonly meta?: { titleKey?: string; permission?: string };
  readonly children?: readonly AppRouteObject[];
}
```

`guard: 'protected'` routes are nested under the `ProtectedRoute` guard and
`AppLayout`; everything else renders directly under `RootLayout`. The guard is
declarative data in the contract — it is never hand-wired in the shell.

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

Never edit `routes.tsx`, `route-composer.tsx`, or `route-mapper.tsx` to add a
page.

## Enforcement

- **dependency-cruiser** `no-routes-import-feature-internals` — the shell may
  reach a feature only through its `routes/index` contract barrel and the
  `protected-route` guard. Deep-importing a page (`@auth/routes/sign-up`) fails
  the gate. Verified by `tests/unit/tooling/route-registry-boundary.test.ts`.
- **Unit tests** — `tests/unit/routes/*` cover the composer (invariants A/B/D:
  single `RootLayout`, `protected`→`AppLayout`, public not), the validator
  (duplicate id / unlocatable route), and the registry; per-route code splitting
  is asserted in `tests/unit/tooling/performance-serving.test.ts`.

Never satisfy a gate with a suppression — route through the contract instead.
