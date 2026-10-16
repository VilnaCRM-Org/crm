import ROUTE_PATHS from './route-paths';
import type { AppRouteObject } from './types/app-route';
import type { RouteModule, RouteModuleRegistry } from './types/route-module';

class RouteValidator {
  public validate({ items: modules }: RouteModuleRegistry): void {
    this.assertUniqueIds(modules);
    this.assertNotFoundRegistered(modules);
    for (const { routes } of modules) {
      for (const route of routes) this.assertRoute(route, false);
    }
  }

  private assertUniqueIds(modules: readonly RouteModule[]): void {
    const ids = modules.map((module) => module.id);
    const duplicate = ids.find((id, index) => ids.indexOf(id) !== index);
    if (duplicate !== undefined) {
      throw new Error(`Duplicate route module id: ${duplicate}`);
    }
  }

  private assertNotFoundRegistered(modules: readonly RouteModule[]): void {
    const routes = modules.flatMap((module) => module.routes);
    const flagged = routes.some((route) => route.flag !== undefined);
    if (flagged && !routes.some((route) => route.path === ROUTE_PATHS.notFound)) {
      throw new Error('A flagged route needs a registered not-found route');
    }
  }

  private assertRoute(route: AppRouteObject, nested: boolean): void {
    this.assertLocatable(route);
    if (nested && route.guard !== undefined) {
      throw new Error('Nested routes must not declare a guard (guards are top-level only)');
    }
    if (nested && route.flag !== undefined) {
      throw new Error('Nested routes must not declare a flag (flags are top-level only)');
    }
    route.children?.forEach((child) => this.assertRoute(child, true));
  }

  private assertLocatable(route: AppRouteObject): void {
    if (route.index !== true && route.path === undefined) {
      throw new Error('Route must declare a path or be an index route');
    }
  }
}

export default new RouteValidator();
