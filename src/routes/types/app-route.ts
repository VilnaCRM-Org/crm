import type { ComponentType } from 'react';

export type RouteGuard = 'protected' | 'public';

export interface RouteMeta {
  readonly titleKey?: string;
  readonly permission?: string;
}

interface RouteCommon {
  readonly load: () => Promise<{ default: ComponentType }>;
  readonly guard?: RouteGuard;
  readonly meta?: RouteMeta;
}

interface IndexRoute extends RouteCommon {
  readonly index: true;
  readonly path?: never;
  readonly children?: never;
}

interface PathRoute extends RouteCommon {
  readonly path: string;
  readonly index?: never;
  readonly children?: readonly AppRouteObject[];
}

// Exactly one of `index` or `path` (react-router index routes are leaves and
// carry no path/children). `guard` applies to a module's top-level routes only —
// nested children inherit their parent's protection context (enforced by the
// RouteValidator), so declaring a guard on a child is a contract error.
export type AppRouteObject = IndexRoute | PathRoute;
