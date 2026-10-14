import ROUTE_PATHS from '@/routes/route-paths';
import type { RouteModule } from '@/routes/types/route-module';

const authRoutes: RouteModule = {
  id: 'user.auth',
  routes: [
    {
      path: ROUTE_PATHS.signUp,
      guard: 'public',
      load: () => import(/* webpackChunkName: "sign-up" */ './sign-up'),
      meta: { titleKey: 'sign_up.title' },
    },
    {
      path: ROUTE_PATHS.signIn,
      guard: 'public',
      load: () => import(/* webpackChunkName: "sign-in" */ './sign-in'),
      meta: { titleKey: 'sign_in.title' },
    },
  ],
};

export default authRoutes;
