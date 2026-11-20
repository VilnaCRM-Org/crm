import { useCallback } from 'react';

import useInlineBatch from '@/hooks/use-inline-batch';
import useNotificationViews from '@/hooks/use-notification-views';
import useNotifications from '@/hooks/use-notifications';
import useRetiringNotificationViews from '@/hooks/use-retiring-notification-views';
import type { NotificationAnchor } from '@/lib/notifications/types/notification-draft';
import type { NotificationViewSet } from '@/lib/notifications/types/notification-view';

export default function useSlotViews(anchor: NotificationAnchor): NotificationViewSet {
  const { withdraw } = useNotifications();
  const retire = useCallback((): void => withdraw(anchor), [withdraw, anchor]);

  return useRetiringNotificationViews(useNotificationViews(useInlineBatch(anchor)), retire);
}
