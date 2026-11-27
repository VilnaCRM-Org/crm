import type {
  NotificationFocusReturn,
  NotificationOutletState,
} from '@/lib/notifications/types/notification-outlet-state';
import useNotificationOutletStore from '@/lib/notifications/use-notification-outlet-store';

export default function useNotificationFocus(): NotificationFocusReturn | null {
  return useNotificationOutletStore((state: NotificationOutletState) => state.focus);
}
