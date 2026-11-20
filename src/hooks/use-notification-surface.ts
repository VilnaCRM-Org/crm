import notificationStyleConfig from '@/config/runtime/notification-style-config';
import NOTIFICATION_SURFACES from '@/lib/notifications/notification-surfaces';
import type { NotificationSurface } from '@/lib/notifications/types/notification-surface';

export default function useNotificationSurface(surface: NotificationSurface): boolean {
  return NOTIFICATION_SURFACES[notificationStyleConfig.value()] === surface;
}
