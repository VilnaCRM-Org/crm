import type { AppRouteObject } from './types/app-route';
import type { RouteModule, RouteModuleRegistry } from './types/route-module';

class RouteValidator {
  public validate({ items: modules }: RouteModuleRegistry): void {
    this.assertUniqueIds(modules);
    this.assertOneUserMenu(modules);
    modules.forEach((module) => module.routes.forEach((route) => this.assertRoute(route, false)));
  }

  private assertUniqueIds(modules: readonly RouteModule[]): void {
    const ids = modules.map((module) => module.id);
    const duplicate = ids.find((id, index) => ids.indexOf(id) !== index);
    if (duplicate !== undefined) {
      throw new Error(`Duplicate route module id: ${duplicate}`);
    }
  }

  private assertOneUserMenu(modules: readonly RouteModule[]): void {
    const declaring: string[] = [];
    for (const { id, shell } of modules) {
      if (shell?.userMenu !== undefined) declaring.push(id);
    }
    if (declaring.length > 1) {
      throw new Error(`Only one route module may declare shell.userMenu (${declaring.join(', ')})`);
    }
  }

  private assertRoute(route: AppRouteObject, nested: boolean): void {
    this.assertLocatable(route);
    if (nested && route.guard !== undefined) {
      throw new Error('Nested routes must not declare a guard (guards are top-level only)');
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
