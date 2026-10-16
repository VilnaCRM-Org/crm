import settingsRoutes from '@/modules/user/features/settings/routes';
import ROUTE_PATHS from '@/routes/route-paths';

jest.mock('@/assets/icons/eye.svg', () => ({ ReactComponent: 'svg' }));
jest.mock('@/assets/icons/eye-off.svg', () => ({ ReactComponent: 'svg' }));

describe('settings route contract', () => {
  const [route, ...rest] = settingsRoutes.routes;

  it('registers one module named user.settings with a single route', () => {
    expect(settingsRoutes.id).toBe('user.settings');
    expect(rest).toEqual([]);
  });

  it('declares /settings as a protected route behind the userSettings flag', () => {
    expect(route).toMatchObject({
      path: ROUTE_PATHS.settings,
      guard: 'protected',
      flag: 'userSettings',
      meta: { titleKey: 'settings.title' },
    });
    expect(ROUTE_PATHS.settings).toBe('/settings');
  });

  it('lazy-loads the UserProfile page', async () => {
    const { default: UserProfile } = await (
      route as { load: () => Promise<{ default: unknown }> }
    ).load();

    expect(UserProfile).toEqual(expect.any(Function));
    expect((UserProfile as { name: string }).name).toBe('UserProfile');
  });
});
