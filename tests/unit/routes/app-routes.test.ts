import ROUTE_PATHS from '@/routes/route-paths';
import type { AppRouteObject } from '@/routes/types/app-route';
import type { RouteModule } from '@/routes/types/route-module';
import loadIsolated from '@tests/unit/utils/isolated-module';

/**
 * The contract is a single top-level literal evaluated at import, so it is loaded inside the test
 * body rather than imported at the top: a mutant in a static literal is otherwise credited to
 * whichever unrelated suite happened to load the module first, and comes back unscored.
 *
 * Route ids, guards and paths are fixed contracts, so the pinned values are the test
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

  it('declares exactly the home, access-denied and not-found routes, in that order', async () => {
    const appRoutes = await loadAppRoutes();

    expect(appRoutes.routes).toHaveLength(3);
    expect(routeAt(appRoutes, 0).index).toBe(true);
    expect(routeAt(appRoutes, 0).path).toBeUndefined();
    expect(routeAt(appRoutes, 1).path).toBe(ROUTE_PATHS.accessDenied);
    expect(routeAt(appRoutes, 1).index).toBeUndefined();
    expect(routeAt(appRoutes, 2).path).toBe(ROUTE_PATHS.notFound);
    expect(routeAt(appRoutes, 2).index).toBeUndefined();
  });

  // Authentication is the only gate the shell applies: what a principal may do is decided by
  // the server and read back through the mutation gate, never from route metadata (issue #114).
  it('protects the home index route without declaring any authorization metadata', async () => {
    const home = routeAt(await loadAppRoutes(), 0);

    expect(home.guard).toBe('protected');
    expect(home.meta).toBeUndefined();
    expect(typeof home.load).toBe('function');
  });

  it('keeps the access-denied and not-found routes public and metadata-free', async () => {
    const appRoutes = await loadAppRoutes();

    [routeAt(appRoutes, 1), routeAt(appRoutes, 2)].forEach((route) => {
      expect(route.guard).toBe('public');
      expect(route.meta).toBeUndefined();
      expect(typeof route.load).toBe('function');
    });
  });
});
