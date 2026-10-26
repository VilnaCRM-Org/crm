import type { AppRouteObject } from './app-route';
import type { RouteModuleShell } from './shell-slot';

export interface RouteModuleRegistry {
  readonly items: readonly RouteModule[];
}

export interface RouteModule {
  readonly id: string;
  readonly routes: readonly AppRouteObject[];
  readonly shell?: RouteModuleShell | undefined;
}
