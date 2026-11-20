import type { RouteModule } from '@/routes/types/route-module';
import loadIsolated from '@tests/unit/utils/isolated-module';

jest.mock('@/modules/user/features/notifications/components/notifications-shell-slot', () => ({
  __esModule: true,
  default: function MockNotificationsShellSlot(): null {
    return null;
  },
}));

const loadContract = (): Promise<RouteModule> =>
  loadIsolated(async () => (await import('@/modules/user/features/notifications/routes')).default);

describe('notifications route contract', () => {
  it('registers user.notifications with no routes of its own', async () => {
    const notificationsRoutes = await loadContract();

    expect(notificationsRoutes.id).toBe('user.notifications');
    expect(notificationsRoutes.routes).toEqual([]);
  });

  it('declares only the notifications shell slot', async () => {
    const notificationsRoutes = await loadContract();

    expect(Object.keys(notificationsRoutes.shell ?? {})).toEqual(['notifications']);
  });

  it('lazy-loads the notifications shell slot module', async () => {
    const notificationsRoutes = await loadContract();

    const loaded = await notificationsRoutes.shell?.notifications?.();

    expect(loaded?.default.name).toBe('MockNotificationsShellSlot');
  });
});
