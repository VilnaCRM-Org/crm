import type { RouteModule } from '@/routes/types/route-module';
import loadIsolated from '@tests/unit/utils/isolated-module';

jest.mock('@/modules/user/features/settings/routes/user-profile', () => ({
  __esModule: true,
  default: function MockUserProfile(): null {
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
  it('registers one module named user.settings with a single route', async () => {
    const { settingsRoutes } = await loadContract();

    expect(settingsRoutes.id).toBe('user.settings');
    expect(settingsRoutes.routes).toHaveLength(1);
  });

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
