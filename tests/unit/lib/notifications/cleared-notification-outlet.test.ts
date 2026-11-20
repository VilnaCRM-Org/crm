import type { NotificationOutletState } from '@/lib/notifications/types/notification-outlet-state';
import loadIsolated from '@tests/unit/utils/isolated-module';

const loadCleared = (): Promise<NotificationOutletState> =>
  loadIsolated(
    async () =>
      (await import('@/lib/notifications/cleared-notification-outlet')).CLEARED_NOTIFICATION_OUTLET
  );

describe('CLEARED_NOTIFICATION_OUTLET', () => {
  it('holds an empty outlet with counters at their starting values', async () => {
    const cleared = await loadCleared();

    expect(cleared).toEqual({
      shown: { items: [] },
      raised: { items: [] },
      inline: { items: [] },
      announcement: { polite: '', assertive: '' },
      focus: null,
      revision: 0,
      nextId: 1,
      nextBatch: 1,
      marked: false,
    });
  });

  it('is frozen at every level', async () => {
    const cleared = await loadCleared();

    expect(Object.isFrozen(cleared)).toBe(true);
    expect(Object.isFrozen(cleared.shown)).toBe(true);
    expect(Object.isFrozen(cleared.shown.items)).toBe(true);
    expect(Object.isFrozen(cleared.raised)).toBe(true);
    expect(Object.isFrozen(cleared.raised.items)).toBe(true);
    expect(Object.isFrozen(cleared.inline)).toBe(true);
    expect(Object.isFrozen(cleared.inline.items)).toBe(true);
    expect(Object.isFrozen(cleared.announcement)).toBe(true);
  });
});
