import registry from '@/routes/registry';
import ROUTE_PATHS from '@/routes/route-paths';

describe('route registry', () => {
  it('collects the module route contracts in composition order with unique ids', () => {
    const ids = registry.items.map((module) => module.id);

    expect(ids).toEqual(['app.shell', 'user.auth', 'user.settings']);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('declares every route with a loader and a locatable target', () => {
    registry.items.forEach((module) => {
      module.routes.forEach((route) => {
        expect(typeof route.load).toBe('function');
        expect(route.index === true || typeof route.path === 'string').toBe(true);
      });
    });
  });

  it('declares the app-shell home (protected) and 404 (public) routes', () => {
    const shell = registry.items.find((module) => module.id === 'app.shell');
    // Select by stable identity, not array position, so reordering can't silently
    // pass with the wrong fixtures.
    const home = shell?.routes.find((route) => route.index === true);
    const notFound = shell?.routes.find((route) => route.path === ROUTE_PATHS.notFound);

    expect(home?.guard).toBe('protected');
    expect(home?.meta?.permission).toBe('app.home');
    expect(notFound).toBeDefined();
    expect(notFound?.guard).toBe('public');
  });

  it('declares the 403 and 5xx error pages as public app-shell routes (#309)', () => {
    const shell = registry.items.find((module) => module.id === 'app.shell');
    const forbidden = shell?.routes.find((route) => route.path === ROUTE_PATHS.forbidden);
    const serverError = shell?.routes.find((route) => route.path === ROUTE_PATHS.serverError);

    expect(forbidden?.guard).toBe('public');
    expect(serverError?.guard).toBe('public');
    expect(shell?.routes.map((route) => route.path)).toEqual([
      undefined,
      ROUTE_PATHS.boards,
      ROUTE_PATHS.products,
      ROUTE_PATHS.orders,
      ROUTE_PATHS.contacts,
      ROUTE_PATHS.analytics,
      ROUTE_PATHS.forbidden,
      ROUTE_PATHS.serverError,
      ROUTE_PATHS.notFound,
    ]);
  });

  it('declares the settings page as a protected route behind the userSettings flag', () => {
    const settings = registry.items
      .flatMap((module) => module.routes)
      .find((route) => route.path === ROUTE_PATHS.settings);

    expect(
      registry.items.find((module) => module.id === 'user.settings')?.routes.map(({ path }) => path)
    ).toEqual([
      ROUTE_PATHS.settings,
      ROUTE_PATHS.settingsIntegrations,
      ROUTE_PATHS.settingsWebhooks,
      ROUTE_PATHS.settingsBilling,
    ]);
    expect(settings?.guard).toBe('protected');
    expect(settings?.flag).toBe('userSettings');
    expect(settings?.meta?.titleKey).toBe('settings.title');
  });

  it('declares the eight coming-soon routes, the settings three behind the flag', () => {
    const routes = registry.items.flatMap((module) => module.routes);
    const comingSoon = [
      [ROUTE_PATHS.boards, undefined],
      [ROUTE_PATHS.products, undefined],
      [ROUTE_PATHS.orders, undefined],
      [ROUTE_PATHS.contacts, undefined],
      [ROUTE_PATHS.analytics, undefined],
      [ROUTE_PATHS.settingsIntegrations, 'userSettings'],
      [ROUTE_PATHS.settingsWebhooks, 'userSettings'],
      [ROUTE_PATHS.settingsBilling, 'userSettings'],
    ] as const;

    for (const [path, flag] of comingSoon) {
      const route = routes.find((candidate) => candidate.path === path);

      expect(route?.guard).toBe('protected');
      expect(route?.flag).toBe(flag);
    }
  });

  it('declares the auth pages as public routes carrying their title metadata', () => {
    const auth = registry.items.find((module) => module.id === 'user.auth');

    expect(auth?.routes.map((route) => route.path)).toEqual([
      ROUTE_PATHS.signUp,
      ROUTE_PATHS.signIn,
      ROUTE_PATHS.twoFactorChallenge,
      ROUTE_PATHS.passwordRecovery,
      ROUTE_PATHS.passwordReset,
    ]);
    expect(auth?.routes.every((route) => route.guard === 'public')).toBe(true);
    expect(auth?.routes.map((route) => route.meta?.titleKey)).toEqual([
      'sign_up.title',
      'sign_in.title',
      'two_factor.title',
      'password_recovery.title',
      'password_reset.title',
    ]);
  });
});
