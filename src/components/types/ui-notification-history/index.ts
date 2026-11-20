import type { ReactNode } from 'react';

import type {
  NotificationView,
  NotificationViewSet,
} from '@/lib/notifications/types/notification-view';

export type NotificationUnreadSet = ReadonlySet<string>;

export interface NotificationHistoryCopy {
  readonly heading: string;
  readonly empty: string;
  readonly markAllRead: string;
  readonly unread: string;
}

export interface UINotificationHistoryProps {
  readonly views: NotificationViewSet;
  readonly unread: NotificationUnreadSet;
  readonly copy: NotificationHistoryCopy;
  readonly onMarkAllRead: () => void;
}

export interface UINotificationHistoryFrameProps {
  readonly id: string;
  readonly open: boolean;
  readonly children?: ReactNode;
}

export interface HistoryRowProps {
  readonly view: NotificationView;
  readonly unread: boolean;
  readonly label: string;
}

export interface HistoryBodyProps {
  readonly views: NotificationViewSet;
  readonly unread: NotificationUnreadSet;
  readonly copy: NotificationHistoryCopy;
}
