import type { NotificationDraft } from './notification-draft';

export interface ShownNotification extends NotificationDraft {
  readonly id: number;
  readonly batch: number;
  readonly raisedAt: number;
}

export interface ShownNotificationSet {
  readonly items: readonly ShownNotification[];
}
