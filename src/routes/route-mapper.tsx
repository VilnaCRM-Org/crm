import { lazy } from 'react';
import type { RouteObject } from 'react-router';

import type { AppRouteObject } from './types/app-route';

class RouteMapper {
  public map(route: AppRouteObject): RouteObject {
    const Page = lazy(route.load);
    const element = <Page />;
    if (route.index) {
      return { index: true, element };
    }
    return { path: route.path, element, ...this.nested(route) };
  }

  private nested(route: AppRouteObject): { children?: RouteObject[] } {
    if (!route.children?.length) {
      return {};
    }
    return { children: route.children.map((child) => this.map(child)) };
  }
}

export default new RouteMapper();
