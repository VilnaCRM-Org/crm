import type { StoreApi } from 'zustand';

import { CLEARED_NOTIFICATION_OUTLET } from './cleared-notification-outlet';
import notificationRaiseBuilder from './notification-raise-builder';
import type { NotificationAnchor, NotificationDraftSet } from './types/notification-draft';
import type {
  NotificationClock,
  NotificationFocusReturn,
  NotificationOutletState,
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
    this.store.setState((state: NotificationOutletState): Partial<NotificationOutletState> => ({
      shown: { items: state.shown.items.filter((item) => item.id !== id) },
    }));
  }

  public dismissAll(): void {
    this.store.setState({ shown: CLEARED_NOTIFICATION_OUTLET.shown });
  }

  public withdraw(anchor: NotificationAnchor): void {
    this.store.setState((state: NotificationOutletState): Partial<NotificationOutletState> => ({
      inline: { items: state.inline.items.filter((batch) => batch.anchor !== anchor) },
    }));
  }

  public publishFocus(focus: NotificationFocusReturn): void {
    this.store.setState({ focus });
  }

  public clear(): void {
    const { shown, raised, inline, announcement, focus } = CLEARED_NOTIFICATION_OUTLET;
    this.store.setState({ shown, raised, inline, announcement, focus });
  }
}
