import { lazy } from 'react';
import type { RouteObject } from 'react-router';

import RouteError from '@/components/error-boundary/route-error';
import type { FallbackLandmark } from '@/components/types/error-boundary';
import ChunkRetryLoader from '@/lib/reliability/chunk-retry-loader';
import ReloadOnceGuard from '@/lib/reliability/reload-once-guard';
import ReloadingChunkLoader from '@/lib/reliability/reloading-chunk-loader';

import type { AppRouteObject, PageLoader, PageModule } from './types/app-route';

class RouteMapper {
  private readonly reloadGuard = new ReloadOnceGuard();

  public map(route: AppRouteObject, landmark: FallbackLandmark): RouteObject {
    const loader = this.loaderFor(route);
    const Page = lazy(() => loader.load());
    const element = <Page />;
    const errorElement = <RouteError landmark={landmark} />;
    if (route.index) {
      return { index: true, element, errorElement };
    }
    return { path: route.path, element, errorElement, ...this.nested(route, landmark) };
  }

  // Every page chunk is retried once. A public page may then reload the document to pick up a
  // fresh deploy; a protected page may not, because the in-memory auth token would not survive
  // the reload (ADR-007) — its second failure goes to the route error boundary instead.
  private loaderFor(route: AppRouteObject): PageLoader {
    const retrying = new ChunkRetryLoader<PageModule>(route.load);
    if (route.guard === 'protected') {
      return retrying;
    }
    return new ReloadingChunkLoader(this.reloadKey(route), retrying, this.reloadGuard);
  }

  private reloadKey(route: AppRouteObject): string {
    return route.path ?? 'index';
  }

  private nested(route: AppRouteObject, landmark: FallbackLandmark): { children?: RouteObject[] } {
    if (!route.children?.length) {
      return {};
    }
    return { children: route.children.map((child) => this.map(child, landmark)) };
  }
}

export default new RouteMapper();
