import ROUTE_PATHS from '@/routes/route-paths';
import type { RouteModule } from '@/routes/types/route-module';

const settingsRoutes: RouteModule = {
  id: 'user.settings',
  shell: {
    userMenu: () =>
      import(/* webpackChunkName: "user-menu" */ '../components/user-menu/user-menu-slot'),
  },
  routes: [
    {
      path: ROUTE_PATHS.settings,
      guard: 'protected',
      load: () => import(/* webpackChunkName: "settings" */ './user-profile'),
      meta: { titleKey: 'settings.title' },
    },
    {
      path: ROUTE_PATHS.settingsIntegrations,
      guard: 'protected',
      load: () => import(/* webpackChunkName: "coming-soon" */ '@/components/coming-soon'),
    },
    {
      path: ROUTE_PATHS.settingsWebhooks,
      guard: 'protected',
      load: () => import(/* webpackChunkName: "coming-soon" */ '@/components/coming-soon'),
    },
    {
      path: ROUTE_PATHS.settingsBilling,
      guard: 'protected',
      load: () => import(/* webpackChunkName: "coming-soon" */ '@/components/coming-soon'),
    },
  ],
};

export default settingsRoutes;
