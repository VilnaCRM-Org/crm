import type { AppRouteObject } from './types/app-route';
import type { RouteModule } from './types/route-module';

class RouteValidator {
  public validate(modules: readonly RouteModule[]): void {
    this.assertUniqueIds(modules);
    modules.forEach((module) => module.routes.forEach((route) => this.assertRoute(route, false)));
  }

  private assertUniqueIds(modules: readonly RouteModule[]): void {
    const ids = modules.map((module) => module.id);
    const duplicate = ids.find((id, index) => ids.indexOf(id) !== index);
    if (duplicate !== undefined) {
      throw new Error(`Duplicate route module id: ${duplicate}`);
    }
  }

  private assertRoute(route: AppRouteObject, nested: boolean): void {
    this.assertLocatable(route);
    if (nested && route.guard !== undefined) {
      throw new Error('Nested routes must not declare a guard (guards are top-level only)');
    }
    if (nested && route.meta?.permission !== undefined) {
      throw new Error('Nested routes must not declare a permission (gates are top-level only)');
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
