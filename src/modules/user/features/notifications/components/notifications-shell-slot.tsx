import type { JSX } from 'react';

import useBroadcastEvents from '../hooks/use-broadcast-events';
import useNotificationRecorder from '../hooks/use-notification-recorder';
import { NotificationRepositoryContext } from '../hooks/use-notification-repository';
import useSessionRepository from '../hooks/use-session-repository';
import type { NotificationsShellSlotProps, SessionNotificationsProps } from '../types/components';

import BellNotifications from './bell-notifications';

function SessionNotifications({ layout, onChunkFailure }: SessionNotificationsProps): JSX.Element {
  const recorded = useNotificationRecorder(onChunkFailure);
  const revision = recorded + useBroadcastEvents(onChunkFailure);

  return <BellNotifications layout={layout} revision={revision} onChunkFailure={onChunkFailure} />;
}

export default function NotificationsShellSlot({
  layout,
  onChunkFailure,
}: NotificationsShellSlotProps): JSX.Element {
  const repository = useSessionRepository();

  return (
    <NotificationRepositoryContext.Provider value={repository}>
      <SessionNotifications layout={layout} onChunkFailure={onChunkFailure} />
    </NotificationRepositoryContext.Provider>
  );
}
