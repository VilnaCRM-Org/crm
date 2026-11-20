import type { TFunction } from 'i18next';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import type { NotificationMessageKey } from '@/lib/notifications/types/notification-draft';
import type {
  NotificationView,
  NotificationViewSet,
} from '@/lib/notifications/types/notification-view';
import type {
  ShownNotification,
  ShownNotificationSet,
} from '@/lib/notifications/types/shown-notification';

import type { NotificationViewsOptions } from './types/notifications-port';

function toView(
  item: ShownNotification,
  t: TFunction,
  timeKey: NotificationMessageKey | undefined
): NotificationView {
  return {
    id: String(item.id),
    kind: item.kind,
    message: t(item.messageKey),
    action:
      item.action === undefined
        ? undefined
        : { label: t(item.action.labelKey), onActivate: item.action.onActivate },
    time: timeKey === undefined ? undefined : t(timeKey, { value: item.raisedAt }),
  };
}

export default function useNotificationViews(
  set: ShownNotificationSet,
  options?: NotificationViewsOptions
): NotificationViewSet {
  const { t } = useTranslation();
  const timeKey = options?.timeKey;

  return useMemo(
    (): NotificationViewSet => ({ items: set.items.map((item) => toView(item, t, timeKey)) }),
    [set, t, timeKey]
  );
}
