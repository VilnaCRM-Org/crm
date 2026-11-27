import type {
  NotificationAnnouncement,
  NotificationOutletState,
} from '@/lib/notifications/types/notification-outlet-state';
import useNotificationOutletStore from '@/lib/notifications/use-notification-outlet-store';

export default function useNotificationAnnouncement(): NotificationAnnouncement {
  return useNotificationOutletStore((state: NotificationOutletState) => state.announcement);
}
