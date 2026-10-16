import { type ClientOnErrorFunction, isRouteErrorResponse, type RouteObject } from 'react-router';

import RouteError from '@/components/error-boundary/route-error';
import AppLayout from '@/components/layouts/app-layout';
import RootLayout from '@/components/layouts/root-layout';
import type { FallbackLandmark } from '@/components/types/error-boundary';
import boundaryErrorReporter from '@/services/error-reporting/boundary-error-reporter';
import ProtectedRoute from '@auth/components/protected-route';

import RouteFlagGate from './route-flag-gate';
import routeMapper from './route-mapper';
import ROUTE_PATHS from './route-paths';
import routeValidator from './route-validator';
import type { AppRouteObject } from './types/app-route';
import type { ComposedRoutes } from './types/composed-routes';
import type { RouteModuleRegistry } from './types/route-module';

class RouteComposer {
  public compose(registry: RouteModuleRegistry): ComposedRoutes {
    routeValidator.validate(registry);
    const routes = registry.items.flatMap((module) => module.routes);
    return {
      items: [
        {
          path: ROUTE_PATHS.home,
          element: <RootLayout />,
          errorElement: <RouteError landmark="main" />,
          children: this.children(routes),
        },
      ],
    };
  }

  public routeErrorHandler(): ClientOnErrorFunction {
    return (error, info): void => {
      try {
        boundaryErrorReporter.report(this.toError(error), {
          componentStack: info.errorInfo?.componentStack,
          surface: 'route',
          pattern: info.pattern,
        });
      } catch {
        // Telemetry must never mask the error the route fallback is already showing.
      }
    };
  }

  private toError(error: unknown): Error {
    if (error instanceof Error) {
      return error;
    }
    if (isRouteErrorResponse(error)) {
      return new Error(`${error.status} ${error.statusText}`);
    }
    return new Error(String(error));
  }

  private children(routes: readonly AppRouteObject[]): RouteObject[] {
    const secured: AppRouteObject[] = [];
    const open: AppRouteObject[] = [];
    for (const route of routes) {
      (route.guard === 'protected' ? secured : open).push(route);
    }
    return this.gated(routes, [...this.protectedBranch(secured), ...this.pages(open, 'main')]);
  }

  // A flag is read when a matched route renders, never while the router is built, so the gate is
  // only emitted when some route declares one. It sits above the protected branch so a flag-off
  // page shows the not-found page to a visitor without a token as well, with no sign-in redirect.
  private gated(routes: readonly AppRouteObject[], branches: RouteObject[]): RouteObject[] {
    const notFound = routes.some((route) => route.flag !== undefined)
      ? routes.find((route) => route.path === ROUTE_PATHS.notFound)
      : undefined;
    if (notFound === undefined) {
      return branches;
    }
    return [
      {
        element: <RouteFlagGate notFound={routeMapper.map(notFound, 'main').element} />,
        errorElement: <RouteError landmark="main" />,
        children: branches,
      },
    ];
  }

  private protectedBranch(routes: readonly AppRouteObject[]): RouteObject[] {
    if (routes.length === 0) {
      return [];
    }
    const errorElement = <RouteError landmark="main" />;
    return [
      {
        element: <ProtectedRoute />,
        errorElement,
        children: [
          { element: <AppLayout />, errorElement, children: this.pages(routes, 'region') },
        ],
      },
    ];
  }

  private pages(routes: readonly AppRouteObject[], landmark: FallbackLandmark): RouteObject[] {
    return routes.map((route) => routeMapper.map(route, landmark));
  }
}

export default new RouteComposer();
