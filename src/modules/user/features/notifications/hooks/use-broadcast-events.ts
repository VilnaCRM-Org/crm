import { useEffect, useState } from 'react';

import appConfigSource from '@/config/runtime/app-config-source';
import type { ShellChunkFailureHandler } from '@/routes/types/shell-slot';

import type { BroadcastEventReceiver } from '../types/broadcast-event';
import BroadcastEventClient from '../utils/broadcast-event-client';
import BroadcastEventParser from '../utils/broadcast-event-parser';

import useNotificationRepository from './use-notification-repository';

export default function useBroadcastEvents(report: ShellChunkFailureHandler): number {
  const repository = useNotificationRepository();
  const [received, setReceived] = useState(0);

  useEffect(() => {
    const base = appConfigSource.url('notificationEventsUrl');
    if (base === undefined) return undefined;
    const receive: BroadcastEventReceiver = (draft) => {
      repository.record({ items: [draft] }).then(
        () => setReceived((count) => count + 1),
        (error: unknown) => report('app-shell:notifications-record', error)
      );
    };
    return new BroadcastEventClient({ base, parser: new BroadcastEventParser(), receive }).open();
  }, [repository, report]);

  return received;
}
