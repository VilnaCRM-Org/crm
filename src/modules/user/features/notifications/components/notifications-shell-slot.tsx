import type { JSX } from 'react';

import useBroadcastEvents from '../hooks/use-broadcast-events';
import useNotificationRecorder from '../hooks/use-notification-recorder';
import type { NotificationsShellSlotProps } from '../types/components';

import BellNotifications from './bell-notifications';

export default function NotificationsShellSlot({
  layout,
  onChunkFailure,
}: NotificationsShellSlotProps): JSX.Element {
  const recorded = useNotificationRecorder(onChunkFailure);
  const revision = recorded + useBroadcastEvents(onChunkFailure);

  return <BellNotifications layout={layout} revision={revision} onChunkFailure={onChunkFailure} />;
}
