import type { ComponentType } from 'react';

import type { FeatureFlag } from '@/config/runtime/types/feature-flag';

export type RouteGuard = 'protected' | 'public';

export interface PageModule {
  default: ComponentType;
}

export interface PageLoader {
  load(): Promise<PageModule>;
}

export interface RouteMeta {
  readonly titleKey?: string;
  readonly permission?: string;
}

export interface RouteHandle {
  readonly flag?: FeatureFlag | undefined;
}

interface RouteCommon {
  readonly load: () => Promise<PageModule>;
  readonly guard?: RouteGuard;
  readonly flag?: FeatureFlag | undefined;
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
