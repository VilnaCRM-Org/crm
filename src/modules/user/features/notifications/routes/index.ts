import type { RouteModule } from '@/routes/types/route-module';

const notificationsRoutes: RouteModule = {
  id: 'user.notifications',
  shell: {
    notifications: () =>
      import(
        /* webpackChunkName: "notifications-shell" */ '../components/notifications-shell-slot'
      ),
  },
  routes: [],
};

export default notificationsRoutes;
