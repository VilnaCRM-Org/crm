import { type RefObject, useCallback } from 'react';

import type { NotificationViewsOptions } from '@/hooks/types/notifications-port';
import useNotificationViews from '@/hooks/use-notification-views';
import useNotifications from '@/hooks/use-notifications';
import useRetiringNotificationViews from '@/hooks/use-retiring-notification-views';
import useShownNotifications from '@/hooks/use-shown-notifications';
import type {
  NotificationView,
  NotificationViewSet,
} from '@/lib/notifications/types/notification-view';

export default function useBellNoticeViews(
  options: NotificationViewsOptions,
  bellRef: RefObject<HTMLElement | null>
): NotificationViewSet {
  const { dismiss } = useNotifications();
  const retire = useCallback((view: NotificationView): void => dismiss(Number(view.id)), [dismiss]);

  return useRetiringNotificationViews(
    useNotificationViews(useShownNotifications(), options),
    retire,
    bellRef
  );
}
