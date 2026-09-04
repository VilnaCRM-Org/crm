import type { RouteObject } from 'react-router-dom';

import RouteError from '@/components/error-boundary/route-error';
import AppLayout from '@/components/layouts/app-layout';
import RootLayout from '@/components/layouts/root-layout';
import ProtectedRoute from '@auth/components/protected-route';

import permissionBranchBuilder from './permission-branch-builder';
import routeMapper from './route-mapper';
import ROUTE_PATHS from './route-paths';
import routeValidator from './route-validator';
import type { AppRouteObject } from './types/app-route';
import type { RouteModule } from './types/route-module';

class RouteComposer {
  public compose(modules: readonly RouteModule[]): RouteObject[] {
    routeValidator.validate(modules);
    const routes = modules.flatMap((module) => module.routes);
    return [
      {
        path: ROUTE_PATHS.home,
        element: <RootLayout />,
        errorElement: <RouteError />,
        children: this.children(routes),
      },
    ];
  }

  private children(routes: readonly AppRouteObject[]): RouteObject[] {
    const secured = routes.filter((route) => route.guard === 'protected');
    const open = routes.filter((route) => route.guard !== 'protected');
    return [...this.protectedBranch(secured), ...open.map((route) => routeMapper.map(route))];
  }

  private protectedBranch(routes: readonly AppRouteObject[]): RouteObject[] {
    if (routes.length === 0) {
      return [];
    }
    const pages = permissionBranchBuilder.build(routes);
    return [
      { element: <ProtectedRoute />, children: [{ element: <AppLayout />, children: pages }] },
    ];
  }
}

export default new RouteComposer();
