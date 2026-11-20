import type {
  NotificationAnchor,
  NotificationDraftSet,
  NotificationMessageKey,
} from '@/lib/notifications/types/notification-draft';

export interface NotificationsPort {
  readonly raise: (drafts: NotificationDraftSet) => void;
  readonly dismiss: (id: number) => void;
  readonly dismissAll: () => void;
  readonly withdraw: (anchor: NotificationAnchor) => void;
}

export interface NotificationViewsOptions {
  readonly timeKey?: NotificationMessageKey | undefined;
}
