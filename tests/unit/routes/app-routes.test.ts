import { PERMISSIONS } from '@/lib/access/permission-catalog';
import ROUTE_PATHS from '@/routes/route-paths';
import type { AppRouteObject } from '@/routes/types/app-route';
import type { RouteModule } from '@/routes/types/route-module';
import loadIsolated from '@tests/unit/utils/isolated-module';

/**
 * The contract is a single top-level literal evaluated at import, so it is loaded inside the test
 * body rather than imported at the top: a mutant in a static literal is otherwise credited to
 * whichever unrelated suite happened to load the module first, and comes back unscored.
 *
 * Route ids, guards, paths and permissions are fixed contracts, so the pinned values are the test
 * case — the identifiers are imported wherever one exists.
 */
const loadAppRoutes = (): Promise<RouteModule> =>
  loadIsolated(async () => (await import('@/routes/app-routes')).default);

const routeAt = (contract: RouteModule, index: number): AppRouteObject => {
  const route = contract.routes[index];

  if (!route) {
    throw new Error(`app.shell declares no route at index ${index}`);
  }

  return route;
};

describe('app shell route contract', () => {
  it('is published under the app.shell module id', async () => {
    const appRoutes = await loadAppRoutes();

    expect(appRoutes.id).toBe('app.shell');
  });

  it('declares exactly the home and not-found routes, in that order', async () => {
    const appRoutes = await loadAppRoutes();

    expect(appRoutes.routes).toHaveLength(2);
    expect(routeAt(appRoutes, 0).index).toBe(true);
    expect(routeAt(appRoutes, 0).path).toBeUndefined();
    expect(routeAt(appRoutes, 1).path).toBe(ROUTE_PATHS.notFound);
    expect(routeAt(appRoutes, 1).index).toBeUndefined();
  });

  it('gates the home index route behind the app-home permission', async () => {
    const home = routeAt(await loadAppRoutes(), 0);

    expect(home.guard).toBe('protected');
    expect(home.meta).toEqual({ permission: PERMISSIONS.appHome });
    expect(typeof home.load).toBe('function');
  });

  it('keeps the not-found route public and metadata-free', async () => {
    const notFound = routeAt(await loadAppRoutes(), 1);

    expect(notFound.guard).toBe('public');
    expect(notFound.meta).toBeUndefined();
    expect(typeof notFound.load).toBe('function');
  });
});
