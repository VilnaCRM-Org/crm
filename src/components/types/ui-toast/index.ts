import type { NotificationView } from '@/lib/notifications/types/notification-view';

export type ToastDismiss = (id: string) => void;

export interface UIToastProps {
  readonly toast: NotificationView;
  readonly onDismiss: ToastDismiss;
}
