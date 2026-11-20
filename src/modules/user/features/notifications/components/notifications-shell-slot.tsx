import type { JSX } from 'react';

import useNotificationRecorder from '../hooks/use-notification-recorder';
import type { NotificationsShellSlotProps } from '../types/components';

import BellNotifications from './bell-notifications';

export default function NotificationsShellSlot({
  layout,
  onChunkFailure,
}: NotificationsShellSlotProps): JSX.Element {
  const revision = useNotificationRecorder(onChunkFailure);

  return <BellNotifications layout={layout} revision={revision} onChunkFailure={onChunkFailure} />;
}
