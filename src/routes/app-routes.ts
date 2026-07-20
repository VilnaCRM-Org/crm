import ROUTE_PATHS from './route-paths';
import type { RouteModule } from './types/route-module';

const appRoutes: RouteModule = {
  id: 'app.shell',
  routes: [
    {
      index: true,
      guard: 'protected',
      load: () => import('@/button-example'),
      meta: { permission: 'app.home' },
    },
    {
      path: ROUTE_PATHS.notFound,
      guard: 'public',
      load: () => import('@/components/not-found/not-found'),
    },
  ],
};

export default appRoutes;
