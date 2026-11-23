import { useCallback, useEffect, useState } from 'react';

import type { ShellChunkFailureHandler } from '@/routes/types/shell-slot';

import type {
  NotificationHistory,
  NotificationHistorySnapshot,
} from '../types/notification-history';
import type { NotificationRecordSet } from '../types/notification-record';
import type { NotificationRepository } from '../types/notification-repository';

import useNotificationRepository from './use-notification-repository';

const NO_RECORDS: NotificationRecordSet = Object.freeze({ items: Object.freeze([]) });

async function read(repository: NotificationRepository): Promise<NotificationHistorySnapshot> {
  const [records, unread] = await Promise.all([repository.list(), repository.countUnread()]);

  return { records, unread };
}

export default function useNotificationHistory(
  revision: number,
  report: ShellChunkFailureHandler
): NotificationHistory {
  const repository = useNotificationRepository();
  const [snapshot, setSnapshot] = useState<NotificationHistorySnapshot>({
    records: NO_RECORDS,
    unread: 0,
  });

  const refresh = useCallback(
    (): Promise<void> =>
      read(repository).then(setSnapshot, (error: unknown) =>
        report('app-shell:notifications-list', error)
      ),
    [repository, report]
  );

  const markAllRead = useCallback(
    (): Promise<void> =>
      repository
        .markAllRead()
        .then(refresh, (error: unknown) => report('app-shell:notifications-mark-read', error)),
    [repository, refresh, report]
  );

  useEffect(() => {
    refresh();
  }, [refresh, revision]);

  return { ...snapshot, markAllRead, refresh };
}
