import { type ClientOnErrorFunction, isRouteErrorResponse, type RouteObject } from 'react-router';

import RouteError from '@/components/error-boundary/route-error';
import RootLayout from '@/components/layouts/root-layout';
import type { FallbackLandmark } from '@/components/types/error-boundary';
import boundaryErrorReporter from '@/services/error-reporting/boundary-error-reporter';

import protectedLayoutLoader from './protected-layout-loader';
import routeMapper from './route-mapper';
import ROUTE_PATHS from './route-paths';
import routeValidator from './route-validator';
import type { AppRouteObject } from './types/app-route';
import type { ComposedRoutes } from './types/composed-routes';
import type { ProtectedShellLoads } from './types/protected-layout';
import type { RouteModuleRegistry } from './types/route-module';
import type { ShellSlotKey, ShellSlotLoad } from './types/shell-slot';

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
          children: this.children(routes, {
            userMenu: this.shellLoad(registry, 'userMenu'),
            notifications: this.shellLoad(registry, 'notifications'),
          }),
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

  private shellLoad(registry: RouteModuleRegistry, key: ShellSlotKey): ShellSlotLoad | undefined {
    for (const { shell } of registry.items) {
      const load = shell?.[key];
      if (load !== undefined) return load;
    }
    return undefined;
  }

  private children(routes: readonly AppRouteObject[], loads: ProtectedShellLoads): RouteObject[] {
    const secured = routes.filter((route) => route.guard === 'protected');
    const open = routes.filter((route) => route.guard !== 'protected');
    return [...this.protectedBranch(secured, loads), ...this.pages(open, 'main')];
  }

  private protectedBranch(
    routes: readonly AppRouteObject[],
    { userMenu, notifications }: ProtectedShellLoads
  ): RouteObject[] {
    if (routes.length === 0) {
      return [];
    }
    const errorElement = <RouteError landmark="main" />;
    const layout = protectedLayoutLoader.create({
      userMenu,
      notifications,
      report: routeMapper.slotFailureReporter(),
    });
    const { ProtectedRoute, AppLayout } = layout;
    return [
      {
        element: <ProtectedRoute />,
        errorElement,
        children: [
          {
            element: (
              <AppLayout
                userMenu={layout.userMenu}
                notifications={layout.notifications}
                onShellFailure={routeMapper.chunkFailureReporter('app-shell:load')}
              />
            ),
            errorElement,
            children: this.pages(routes, 'region'),
          },
        ],
      },
    ];
  }

  private pages(routes: readonly AppRouteObject[], landmark: FallbackLandmark): RouteObject[] {
    return routes.map((route) => routeMapper.map(route, landmark));
  }
}

export default new RouteComposer();
