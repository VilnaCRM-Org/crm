import type { RouteModule } from '@/routes/types/route-module';
import loadIsolated from '@tests/unit/utils/isolated-module';

jest.mock('@/modules/user/features/settings/routes/user-profile', () => ({
  __esModule: true,
  default: function MockUserProfile(): null {
    return null;
  },
}));

jest.mock('@/components/coming-soon', () => ({
  __esModule: true,
  default: function MockComingSoon(): null {
    return null;
  },
}));

interface LoadedContract {
  readonly settingsRoutes: RouteModule;
  readonly settingsPath: string;
}

const loadContract = (): Promise<LoadedContract> =>
  loadIsolated(async () => ({
    settingsRoutes: (await import('@/modules/user/features/settings/routes')).default,
    settingsPath: (await import('@/routes/route-paths')).default.settings,
  }));

describe('settings route contract', () => {
  it('registers user.settings with /settings and three coming-soon routes', async () => {
    const { settingsRoutes } = await loadContract();

    expect(settingsRoutes.id).toBe('user.settings');
    expect(settingsRoutes.routes.map(({ path }) => path)).toEqual([
      '/settings',
      '/settings/integrations',
      '/settings/webhooks',
      '/settings/billing',
    ]);
  });

  it.each(['/settings/integrations', '/settings/webhooks', '/settings/billing'])(
    'declares %s as a protected route behind the userSettings flag',
    async (path) => {
      const { settingsRoutes } = await loadContract();
      const route = settingsRoutes.routes.find((candidate) => candidate.path === path);

      expect(route).toEqual({
        path,
        guard: 'protected',
        flag: 'userSettings',
        load: expect.any(Function),
      });
    }
  );

  it.each(['/settings/integrations', '/settings/webhooks', '/settings/billing'])(
    'lazy-loads the shared coming-soon page for %s',
    async (path) => {
      const { settingsRoutes } = await loadContract();
      const route = settingsRoutes.routes.find((candidate) => candidate.path === path);

      const loaded = await route?.load();

      expect(loaded?.default.name).toBe('MockComingSoon');
    }
  );

  it('declares /settings as a protected route behind the userSettings flag', async () => {
    const { settingsRoutes, settingsPath } = await loadContract();
    const [route] = settingsRoutes.routes;

    expect(settingsPath).toBe('/settings');
    expect(route).toEqual({
      path: '/settings',
      guard: 'protected',
      flag: 'userSettings',
      load: expect.any(Function),
      meta: { titleKey: 'settings.title' },
    });
  });

  it('lazy-loads the user-profile page module', async () => {
    const { settingsRoutes } = await loadContract();
    const [route] = settingsRoutes.routes;

    const loaded = await route?.load();

    expect(loaded?.default).toEqual(expect.any(Function));
    expect(loaded?.default.name).toBe('MockUserProfile');
  });
});
