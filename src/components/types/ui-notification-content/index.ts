import type { NotificationKind } from '@/lib/notifications/types/notification-kind';

export type NotificationIconKind = NotificationKind | 'close';

export interface NotificationIconProps {
  readonly kind: NotificationIconKind;
}
