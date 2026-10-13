import ROUTE_PATHS from './route-paths';
import type { RouteModule } from './types/route-module';

const appRoutes: RouteModule = {
  id: 'app.shell',
  routes: [
    {
      index: true,
      guard: 'protected',
      load: () => import(/* webpackChunkName: "home" */ '@/features/home'),
      meta: { permission: 'app.home' },
    },
    {
      path: ROUTE_PATHS.forbidden,
      guard: 'public',
      load: () => import(/* webpackChunkName: "error-page" */ '@/components/forbidden/forbidden'),
    },
    {
      path: ROUTE_PATHS.serverError,
      guard: 'public',
      load: () =>
        import(/* webpackChunkName: "error-page" */ '@/components/server-error/server-error'),
    },
    {
      path: ROUTE_PATHS.notFound,
      guard: 'public',
      load: () => import(/* webpackChunkName: "error-page" */ '@/components/not-found/not-found'),
    },
  ],
};

export default appRoutes;
