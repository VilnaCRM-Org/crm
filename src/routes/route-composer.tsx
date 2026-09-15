import { type ClientOnErrorFunction, isRouteErrorResponse, type RouteObject } from 'react-router';

import RouteError from '@/components/error-boundary/route-error';
import AppLayout from '@/components/layouts/app-layout';
import RootLayout from '@/components/layouts/root-layout';
import type { FallbackLandmark } from '@/components/types/error-boundary';
import boundaryErrorReporter from '@/services/error-reporting/boundary-error-reporter';
import ProtectedRoute from '@auth/components/protected-route';

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
        errorElement: <RouteError landmark="main" />,
        children: this.children(routes),
      },
    ];
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
    const secured = routes.filter((route) => route.guard === 'protected');
    const open = routes.filter((route) => route.guard !== 'protected');
    return [...this.protectedBranch(secured), ...this.pages(open, 'main')];
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
