import RouteFallback from '@/components/route-fallback';
import ROUTE_PATHS from '@/routes/route-paths';
import type { RouteDefinition } from '@/routes/types/route-definition';

// Single source of every page-level route (issue #117). Each entry is data: a dynamic
// `import()` loader (named so the bundle-size report can track its chunk) and a non-null
// Suspense fallback. The route-manifest machine check fails CI if any loader is eager or
// any fallback is null/empty. `src/routes/routes.tsx` builds the router from this list.
const routeManifest: readonly RouteDefinition[] = [
  {
    id: 'home',
    index: true,
    protected: true,
    load: () => import(/* webpackChunkName: "button-example" */ '@/button-example'),
    fallback: <RouteFallback />,
  },
  {
    id: 'sign-up',
    path: ROUTE_PATHS.signUp,
    load: () => import(/* webpackChunkName: "sign-up" */ '@auth/routes/sign-up'),
    fallback: <RouteFallback />,
  },
  {
    id: 'sign-in',
    path: ROUTE_PATHS.signIn,
    load: () => import(/* webpackChunkName: "sign-in" */ '@auth/routes/sign-in'),
    fallback: <RouteFallback />,
  },
  {
    id: 'not-found',
    path: ROUTE_PATHS.notFound,
    load: () => import(/* webpackChunkName: "not-found" */ '@/components/not-found/not-found'),
    fallback: <RouteFallback />,
  },
];

export default routeManifest;
