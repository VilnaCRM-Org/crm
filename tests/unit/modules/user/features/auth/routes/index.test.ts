import ROUTE_PATHS from '@/routes/route-paths';
import type { RouteModule } from '@/routes/types/route-module';
import loadIsolated from '@tests/unit/utils/isolated-module';

// The whole contract is one module-level literal, so it is evaluated inside the test body. Loaded
// at import scope its mutants carry no per-test coverage and are only reported `Ignored` when some
// unrelated suite in the same shard happens to pull the route registry — which made the file's
// classification depend on shard packing rather than on an assertion (issue #171).
const loadAuthRoutes = (): Promise<RouteModule> =>
  loadIsolated(async () => (await import('@auth/routes')).default);

describe('auth route contract', () => {
  it('is registered under the auth module id', async () => {
    expect((await loadAuthRoutes()).id).toBe('user.auth');
  });

  it('declares exactly the sign-up and sign-in routes, in that order', async () => {
    const { routes } = await loadAuthRoutes();

    expect(routes.map((route) => route.path)).toEqual([ROUTE_PATHS.signUp, ROUTE_PATHS.signIn]);
  });

  it('titles each route with its own localized page-title key', async () => {
    const { routes } = await loadAuthRoutes();

    expect(routes.map((route) => route.meta)).toEqual([
      { titleKey: 'sign_up.title' },
      { titleKey: 'sign_in.title' },
    ]);
  });

  it('leaves both routes public and lazily loaded', async () => {
    const { routes } = await loadAuthRoutes();

    expect(routes.map((route) => route.guard)).toEqual(['public', 'public']);
    routes.forEach((route) => {
      expect(typeof route.load).toBe('function');
    });
  });
});
