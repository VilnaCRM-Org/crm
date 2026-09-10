import ROUTE_PATHS from '@/routes/route-paths';
import type { AppRouteObject } from '@/routes/types/app-route';
import type { RouteModule } from '@/routes/types/route-module';
import loadIsolated from '@tests/unit/utils/isolated-module';

/**
 * The contract is a single top-level literal evaluated at import, so it is loaded inside the test
 * body rather than imported at the top: a mutant in a static literal is otherwise credited to
 * whichever unrelated suite happened to load the module first, and comes back unscored.
 *
 * The loaders themselves are never invoked — the page chunks pull the whole auth tree, and
 * `tests/unit/tooling/performance-serving.test.ts` already pins each one to a named dynamic
 * import.
 */
const loadAuthRoutes = (): Promise<RouteModule> =>
  loadIsolated(async () => (await import('@auth/routes')).default);

const routeFor = (contract: RouteModule, path: string): AppRouteObject => {
  const route = contract.routes.find((candidate) => candidate.path === path);

  if (!route) {
    throw new Error(`user.auth declares no route for "${path}"`);
  }

  return route;
};

describe('auth feature route contract', () => {
  it('is published under the user.auth module id', async () => {
    const authRoutes = await loadAuthRoutes();

    expect(authRoutes.id).toBe('user.auth');
  });

  it('declares exactly the sign-up and sign-in pages, in that order', async () => {
    const authRoutes = await loadAuthRoutes();

    expect(authRoutes.routes).toHaveLength(2);
    expect(authRoutes.routes.map((route) => route.path)).toEqual([
      ROUTE_PATHS.signUp,
      ROUTE_PATHS.signIn,
    ]);
    expect(authRoutes.routes.every((route) => route.index === undefined)).toBe(true);
  });

  it('publishes sign-up as a public page titled by sign_up.title', async () => {
    const signUp = routeFor(await loadAuthRoutes(), ROUTE_PATHS.signUp);

    expect(signUp.guard).toBe('public');
    expect(signUp.meta).toEqual({ titleKey: 'sign_up.title' });
    expect(typeof signUp.load).toBe('function');
  });

  it('publishes sign-in as a public page titled by sign_in.title', async () => {
    const signIn = routeFor(await loadAuthRoutes(), ROUTE_PATHS.signIn);

    expect(signIn.guard).toBe('public');
    expect(signIn.meta).toEqual({ titleKey: 'sign_in.title' });
    expect(typeof signIn.load).toBe('function');
  });
});
