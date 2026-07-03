import type { ComponentType } from 'react';

export type RouteGuard = 'protected' | 'public';

export interface RouteMeta {
  readonly titleKey?: string;
  readonly permission?: string;
}

export interface AppRouteObject {
  readonly path?: string;
  readonly index?: boolean;
  readonly load: () => Promise<{ default: ComponentType }>;
  readonly guard?: RouteGuard;
  readonly meta?: RouteMeta;
  readonly children?: readonly AppRouteObject[];
}
