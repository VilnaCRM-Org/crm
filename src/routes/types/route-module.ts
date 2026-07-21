import type { AppRouteObject } from './app-route';

export interface RouteModule {
  readonly id: string;
  readonly routes: readonly AppRouteObject[];
}
