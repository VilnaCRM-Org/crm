import { useEffect, useState } from 'react';

import useNotificationOutletStore from '@/lib/notifications/use-notification-outlet-store';
import type { ShellChunkFailureHandler } from '@/routes/types/shell-slot';

import type { NotificationRecordDraftSet } from '../types/notification-record';

import useNotificationRepository from './use-notification-repository';

export default function useNotificationRecorder(report: ShellChunkFailureHandler): number {
  const repository = useNotificationRepository();
  const [settled, setSettled] = useState(0);

  useEffect(
    () =>
      useNotificationOutletStore.subscribe((state, previous) => {
        if (state.revision === previous.revision) return;
        const drafts: NotificationRecordDraftSet = {
          items: state.raised.items.map((item) => ({
            kind: item.kind,
            messageKey: item.messageKey,
            createdAt: item.raisedAt,
          })),
        };
        repository.record(drafts).then(
          () => setSettled((count) => count + 1),
          (error: unknown) => report('app-shell:notifications-record', error)
        );
      }),
    [repository, report]
  );

  return settled;
}
