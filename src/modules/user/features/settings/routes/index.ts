import ROUTE_PATHS from '@/routes/route-paths';
import type { RouteModule } from '@/routes/types/route-module';

const settingsRoutes: RouteModule = {
  id: 'user.settings',
  routes: [
    {
      path: ROUTE_PATHS.settings,
      guard: 'protected',
      flag: 'userSettings',
      load: () => import(/* webpackChunkName: "settings" */ './user-profile'),
      meta: { titleKey: 'settings.title' },
    },
  ],
};

export default settingsRoutes;
