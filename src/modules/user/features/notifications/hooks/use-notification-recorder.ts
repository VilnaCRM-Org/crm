import { useEffect, useState } from 'react';

import type {
  NotificationOutletState,
  NotificationRecordedPatch,
} from '@/lib/notifications/types/notification-outlet-state';
import useNotificationOutletStore from '@/lib/notifications/use-notification-outlet-store';
import type { ShellChunkFailureHandler } from '@/routes/types/shell-slot';

import type { NotificationRecordDraftSet } from '../types/notification-record';

import useNotificationRepository from './use-notification-repository';

function draftsOf({ raised }: NotificationOutletState): NotificationRecordDraftSet {
  return {
    items: raised.items.map((item) => ({
      kind: item.kind,
      messageKey: item.messageKey,
      createdAt: item.raisedAt,
    })),
  };
}

function followRaises(record: (drafts: NotificationRecordDraftSet) => void): () => void {
  const follow = (state: NotificationOutletState): void => {
    if (state.revision === state.recorded || state.raised.items.length === 0) return;
    const patch: NotificationRecordedPatch = { recorded: state.revision };
    useNotificationOutletStore.setState(patch);
    record(draftsOf(state));
  };
  follow(useNotificationOutletStore.getState());

  return useNotificationOutletStore.subscribe(follow);
}

export default function useNotificationRecorder(report: ShellChunkFailureHandler): number {
  const repository = useNotificationRepository();
  const [settled, setSettled] = useState(0);

  useEffect(
    () =>
      followRaises((drafts) => {
        repository.record(drafts).then(
          () => setSettled((count) => count + 1),
          (error: unknown) => report('app-shell:notifications-record', error)
        );
      }),
    [repository, report]
  );

  return settled;
}
