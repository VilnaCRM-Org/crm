import CLEARED_NOTIFICATION_OUTLET from '@/lib/notifications/cleared-notification-outlet';
import NotificationOutletActions from '@/lib/notifications/notification-outlet-actions';
import useNotificationOutletStore from '@/lib/notifications/use-notification-outlet-store';
import { buildNotificationDraftSet } from '@tests/builders/notification-draft';
import loadIsolated from '@tests/unit/utils/isolated-module';
import { resetClientStores } from '@tests/utils/reset-client-stores';

describe('useNotificationOutletStore', () => {
  beforeEach(() => resetClientStores());

  it('starts from the cleared value in a freshly loaded module', async () => {
    const fresh = await loadIsolated(
      async () => (await import('@/lib/notifications/use-notification-outlet-store')).default
    );

    expect(fresh.getState()).toEqual({
      shown: { items: [] },
      raised: { items: [] },
      announcement: { polite: '', assertive: '' },
      focus: null,
      revision: 0,
      nextId: 1,
      marked: false,
    });
  });

  it('holds a copy of the cleared value, so the constant itself is never written', () => {
    expect(useNotificationOutletStore.getState()).not.toBe(CLEARED_NOTIFICATION_OUTLET);
    expect(useNotificationOutletStore.getState()).toEqual(CLEARED_NOTIFICATION_OUTLET);
  });

  it('is back to its initial value after resetClientStores', () => {
    const actions = new NotificationOutletActions(useNotificationOutletStore, () => 1);
    actions.raise(buildNotificationDraftSet(2), (key) => key);
    actions.publishFocus({ primary: { current: null } });
    expect(useNotificationOutletStore.getState().revision).toBe(1);

    resetClientStores();

    expect(useNotificationOutletStore.getState()).toEqual(
      useNotificationOutletStore.getInitialState()
    );
    expect(useNotificationOutletStore.getState()).toEqual(CLEARED_NOTIFICATION_OUTLET);
  });
});
