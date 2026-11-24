import type { StoreApi } from 'zustand';

import CLEARED_NOTIFICATION_OUTLET from './cleared-notification-outlet';
import notificationRaiseBuilder from './notification-raise-builder';
import type { NotificationDraftSet } from './types/notification-draft';
import type {
  NotificationClearPatch,
  NotificationClock,
  NotificationFocusPatch,
  NotificationFocusReturn,
  NotificationOutletState,
  NotificationShownPatch,
  NotificationTranslate,
} from './types/notification-outlet-state';

export default class NotificationOutletActions {
  constructor(
    private readonly store: StoreApi<NotificationOutletState>,
    private readonly clock: NotificationClock
  ) {}

  public raise(drafts: NotificationDraftSet, translate: NotificationTranslate): void {
    const raisedAt = this.clock();
    this.store.setState((state: NotificationOutletState): NotificationOutletState =>
      notificationRaiseBuilder.build({ state, drafts, translate, raisedAt })
    );
  }

  public dismiss(id: number): void {
    this.store.setState((state: NotificationOutletState): NotificationShownPatch => ({
      shown: { items: state.shown.items.filter((item) => item.id !== id) },
    }));
  }

  public dismissAll(): void {
    const patch: NotificationShownPatch = { shown: CLEARED_NOTIFICATION_OUTLET.shown };
    this.store.setState(patch);
  }

  public publishFocus(focus: NotificationFocusReturn): void {
    const patch: NotificationFocusPatch = { focus };
    this.store.setState(patch);
  }

  public clear(): void {
    const { shown, raised, announcement, focus } = CLEARED_NOTIFICATION_OUTLET;
    const patch: NotificationClearPatch = { shown, raised, announcement, focus };
    this.store.setState(patch);
  }
}
