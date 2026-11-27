import type {
  NotificationDraftSet,
  NotificationMessageKey,
} from '@/lib/notifications/types/notification-draft';
import type { NotificationFocusReturn } from '@/lib/notifications/types/notification-outlet-state';

export interface NotificationsPort {
  readonly raise: (drafts: NotificationDraftSet) => void;
  readonly dismiss: (id: number) => void;
  readonly dismissAll: () => void;
  readonly publishFocus: (focus: NotificationFocusReturn) => void;
  readonly clear: () => void;
}

export interface NotificationViewsOptions {
  readonly timeKey?: NotificationMessageKey | undefined;
}
