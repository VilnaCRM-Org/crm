import { useCallback, useEffect, useState } from 'react';

import type {
  NotificationHistory,
  NotificationHistorySnapshot,
} from '../types/notification-history';
import type { NotificationRecordSet } from '../types/notification-record';

import useNotificationRepository from './use-notification-repository';

const NO_RECORDS: NotificationRecordSet = Object.freeze({ items: Object.freeze([]) });

export default function useNotificationHistory(revision: number): NotificationHistory {
  const repository = useNotificationRepository();
  const [snapshot, setSnapshot] = useState<NotificationHistorySnapshot>({
    records: NO_RECORDS,
    unread: 0,
  });

  const refresh = useCallback(async (): Promise<void> => {
    const [records, unread] = await Promise.all([repository.list(), repository.countUnread()]);
    setSnapshot({ records, unread });
  }, [repository]);

  const markAllRead = useCallback(async (): Promise<void> => {
    await repository.markAllRead();
    await refresh();
  }, [repository, refresh]);

  useEffect(() => {
    refresh();
  }, [refresh, revision]);

  return { ...snapshot, markAllRead, refresh };
}
