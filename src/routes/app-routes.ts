import ROUTE_PATHS from './route-paths';
import type { RouteModule } from './types/route-module';

const appRoutes: RouteModule = {
  id: 'app.shell',
  routes: [
    {
      index: true,
      guard: 'protected',
      load: () => import(/* webpackChunkName: "button-example" */ '@/button-example'),
    },
    {
      path: ROUTE_PATHS.accessDenied,
      guard: 'public',
      load: () => import(/* webpackChunkName: "access-denied" */ '@/components/access-denied'),
    },
    {
      path: ROUTE_PATHS.notFound,
      guard: 'public',
      load: () => import(/* webpackChunkName: "not-found" */ '@/components/not-found/not-found'),
    },
  ],
};

export default appRoutes;
