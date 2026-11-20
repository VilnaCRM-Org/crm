import type { NotificationViewSet } from '@/lib/notifications/types/notification-view';

export type InlineStatusPlacement = 'actions' | 'email';

export interface UIInlineStatusProps {
  readonly views: NotificationViewSet;
  readonly placement?: InlineStatusPlacement | undefined;
}
