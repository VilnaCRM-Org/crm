import type { TFunction } from 'i18next';
import { type JSX, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import type { NotificationHistoryCopy } from '@/components/types/ui-notification-history';
import UINotificationHistory from '@/components/ui-notification-history';
import notificationValuesAdapter from '@/lib/notifications/notification-values-adapter';
import type {
  NotificationView,
  NotificationViewSet,
} from '@/lib/notifications/types/notification-view';

import type { NotificationHistoryPanelProps } from '../types/components';
import type { NotificationRecord, NotificationRecordSet } from '../types/notification-record';

function toView(record: NotificationRecord, t: TFunction): NotificationView {
  return {
    id: record.id,
    kind: record.kind,
    message: t(record.messageKey, notificationValuesAdapter.options(record.messageValues)),
    time: t('notification_center.time', { value: record.createdAt }),
  };
}

function unreadIds(records: NotificationRecordSet): ReadonlySet<string> {
  return new Set(records.items.filter((record) => !record.read).map((record) => record.id));
}

function historyCopy(t: TFunction): NotificationHistoryCopy {
  return {
    heading: t('notification_center.history.heading'),
    empty: t('notification_center.history.empty'),
    markAllRead: t('notification_center.history.mark_all_read'),
    unread: t('notification_center.history.unread'),
  };
}

export default function NotificationHistoryPanel({
  records,
  onMarkAllRead,
}: NotificationHistoryPanelProps): JSX.Element {
  const { t } = useTranslation();
  const views = useMemo(
    (): NotificationViewSet => ({ items: records.items.map((record) => toView(record, t)) }),
    [records, t]
  );
  const unread = useMemo(() => unreadIds(records), [records]);
  const copy = useMemo(() => historyCopy(t), [t]);

  return (
    <UINotificationHistory
      views={views}
      unread={unread}
      copy={copy}
      onMarkAllRead={onMarkAllRead}
    />
  );
}
