import type { AppRouteObject } from './app-route';

export interface RouteModuleRegistry {
  readonly items: readonly RouteModule[];
}

export interface RouteModule {
  readonly id: string;
  readonly routes: readonly AppRouteObject[];
}
