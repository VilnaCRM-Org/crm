import type { AppRouteObject } from './types/app-route';
import type { RouteModule } from './types/route-module';

class RouteValidator {
  public validate(modules: readonly RouteModule[]): void {
    this.assertUniqueIds(modules);
    modules.forEach((module) => this.assertRoutes(module.routes));
  }

  private assertUniqueIds(modules: readonly RouteModule[]): void {
    const ids = modules.map((module) => module.id);
    const duplicate = ids.find((id, index) => ids.indexOf(id) !== index);
    if (duplicate !== undefined) {
      throw new Error(`Duplicate route module id: ${duplicate}`);
    }
  }

  private assertRoutes(routes: readonly AppRouteObject[]): void {
    routes.forEach((route) => this.assertLocatable(route));
  }

  private assertLocatable(route: AppRouteObject): void {
    if (route.index !== true && route.path === undefined) {
      throw new Error('Route must declare a path or be an index route');
    }
  }
}

export default new RouteValidator();
