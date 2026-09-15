import { lazy } from 'react';
import type { RouteObject } from 'react-router';

import RouteError from '@/components/error-boundary/route-error';
import type { FallbackLandmark } from '@/components/types/error-boundary';

import type { AppRouteObject } from './types/app-route';

class RouteMapper {
  public map(route: AppRouteObject, landmark: FallbackLandmark): RouteObject {
    const Page = lazy(route.load);
    const element = <Page />;
    const errorElement = <RouteError landmark={landmark} />;
    if (route.index) {
      return { index: true, element, errorElement };
    }
    return { path: route.path, element, errorElement, ...this.nested(route, landmark) };
  }

  private nested(route: AppRouteObject, landmark: FallbackLandmark): { children?: RouteObject[] } {
    if (!route.children?.length) {
      return {};
    }
    return { children: route.children.map((child) => this.map(child, landmark)) };
  }
}

export default new RouteMapper();
