import { type JSX, useCallback } from 'react';

import UIBellNotice from '@/components/ui-bell-notice';
import type { NotificationViewsOptions } from '@/hooks/types/notifications-port';
import useNotificationFocus from '@/hooks/use-notification-focus';
import useNotifications from '@/hooks/use-notifications';

import useBellNoticeViews from '../hooks/use-bell-notice-views';
import type { BellOutcomeNoticeProps } from '../types/components';

const NOTICE_VIEWS: NotificationViewsOptions = { timeKey: 'notification_center.time' };

export default function BellOutcomeNotice({ bellRef }: BellOutcomeNoticeProps): JSX.Element {
  const views = useBellNoticeViews(NOTICE_VIEWS);
  const focus = useNotificationFocus();
  const { dismiss } = useNotifications();
  const onDismiss = useCallback((id: string): void => dismiss(Number(id)), [dismiss]);

  return (
    <UIBellNotice
      views={views}
      bellRef={bellRef}
      returnFocusRef={focus?.primary ?? bellRef}
      fallbackFocusRef={focus?.fallback ?? bellRef}
      onDismiss={onDismiss}
    />
  );
}
