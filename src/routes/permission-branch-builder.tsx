import type { RouteObject } from 'react-router-dom';

import type { Permission } from '@/lib/types/access/permission';

import PermissionRoute from './permission-route';
import routeMapper from './route-mapper';
import type { AppRouteObject } from './types/app-route';

class PermissionBranchBuilder {
  public build(routes: readonly AppRouteObject[]): RouteObject[] {
    const ungated = routes.filter((route) => this.permissionOf(route) === undefined);
    return [...ungated.map((route) => routeMapper.map(route)), ...this.branches(routes)];
  }

  private branches(routes: readonly AppRouteObject[]): RouteObject[] {
    return [...this.group(routes)].map(([permission, grouped]) => ({
      element: <PermissionRoute permission={permission} />,
      children: grouped.map((route) => routeMapper.map(route)),
    }));
  }

  private group(routes: readonly AppRouteObject[]): Map<Permission, AppRouteObject[]> {
    const groups = new Map<Permission, AppRouteObject[]>();
    routes.forEach((route) => {
      const permission = this.permissionOf(route);
      if (permission === undefined) return;
      groups.set(permission, [...(groups.get(permission) ?? []), route]);
    });
    return groups;
  }

  private permissionOf(route: AppRouteObject): Permission | undefined {
    return route.meta?.permission;
  }
}

export default new PermissionBranchBuilder();
