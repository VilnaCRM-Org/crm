import type { NotificationOutletState } from '@/lib/notifications/types/notification-outlet-state';
import type { ShownNotificationSet } from '@/lib/notifications/types/shown-notification';
import useNotificationOutletStore from '@/lib/notifications/use-notification-outlet-store';

export default function useShownNotifications(): ShownNotificationSet {
  return useNotificationOutletStore((state: NotificationOutletState) => state.shown);
}
