import { PERMISSIONS } from '@/lib/access/permission-catalog';
import registry from '@/routes/registry';
import ROUTE_PATHS from '@/routes/route-paths';

describe('route registry', () => {
  it('collects the module route contracts in composition order with unique ids', () => {
    const ids = registry.map((module) => module.id);

    expect(ids).toEqual(['app.shell', 'user.auth']);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('declares every route with a loader and a locatable target', () => {
    registry.forEach((module) => {
      module.routes.forEach((route) => {
        expect(typeof route.load).toBe('function');
        expect(route.index === true || typeof route.path === 'string').toBe(true);
      });
    });
  });

  it('declares the app-shell home (protected) and 404 (public) routes', () => {
    const shell = registry.find((module) => module.id === 'app.shell');
    // Select by stable identity, not array position, so reordering can't silently
    // pass with the wrong fixtures.
    const home = shell?.routes.find((route) => route.index === true);
    const notFound = shell?.routes.find((route) => route.path === ROUTE_PATHS.notFound);

    expect(home?.guard).toBe('protected');
    expect(home?.meta?.permission).toBe(PERMISSIONS.appHome);
    expect(notFound).toBeDefined();
    expect(notFound?.guard).toBe('public');
  });

  it('declares the auth pages as public routes carrying their title metadata', () => {
    const auth = registry.find((module) => module.id === 'user.auth');

    expect(auth?.routes.map((route) => route.path)).toEqual([
      ROUTE_PATHS.signUp,
      ROUTE_PATHS.signIn,
    ]);
    expect(auth?.routes.every((route) => route.guard === 'public')).toBe(true);
    expect(auth?.routes.map((route) => route.meta?.titleKey)).toEqual([
      'sign_up.title',
      'sign_in.title',
    ]);
  });
});
