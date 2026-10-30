import { lazy } from 'react';
import type { RouteObject } from 'react-router';

import RouteError from '@/components/error-boundary/route-error';
import type { FallbackLandmark } from '@/components/types/error-boundary';
import ChunkRetryLoader from '@/lib/reliability/chunk-retry-loader';
import ReloadOnceGuard from '@/lib/reliability/reload-once-guard';
import ReloadingChunkLoader from '@/lib/reliability/reloading-chunk-loader';
import muiThemeShellLoader from '@/providers/mui-theme/mui-theme-shell-loader';
import ThemedChunkLoader from '@/providers/mui-theme/themed-chunk-loader';
import observabilityCore from '@/services/observability/observability-core';

import ShellSlotFactory from './shell-slot-factory';
import type { AppRouteObject, PageLoader, PageModule, RouteHandle } from './types/app-route';
import type {
  ShellChunkSource,
  ShellFailureHandler,
  ShellSlotLoad,
  UserMenuSlot,
} from './types/shell-slot';

class RouteMapper {
  private readonly reloadGuard = new ReloadOnceGuard();

  public map(route: AppRouteObject, landmark: FallbackLandmark): RouteObject {
    const loader = this.loaderFor(route);
    const Page = lazy(() => loader.load());
    const element = <Page />;
    const errorElement = <RouteError landmark={landmark} />;
    const handle = this.handle(route);
    if (route.index) {
      return { index: true, element, errorElement, ...handle };
    }
    return { path: route.path, element, errorElement, ...handle, ...this.nested(route, landmark) };
  }

  public shellSlot(load: ShellSlotLoad): UserMenuSlot {
    return new ShellSlotFactory(this.capture.bind(this)).create(load);
  }

  public chunkFailureReporter(source: ShellChunkSource): ShellFailureHandler {
    return (error) => this.capture(source, error);
  }

  private capture(source: ShellChunkSource, error: unknown): void {
    observabilityCore.captureError(error, { source });
  }

  private handle(route: AppRouteObject): { handle?: RouteHandle } {
    return route.flag === undefined ? {} : { handle: { flag: route.flag } };
  }

  // Every page chunk is retried once. A public page may then reload the document to pick up a
  // fresh deploy; a protected page may not, because the in-memory auth token would not survive
  // the reload (issue #116) — its second failure goes to the route error boundary instead.
  private loaderFor(route: AppRouteObject): PageLoader {
    const retrying = new ThemedChunkLoader(
      new ChunkRetryLoader<PageModule>(route.load),
      muiThemeShellLoader
    );
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
