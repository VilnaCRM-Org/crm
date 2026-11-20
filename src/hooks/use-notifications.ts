import { useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import NotificationOutletActions from '@/lib/notifications/notification-outlet-actions';
import type { NotificationDraftSet } from '@/lib/notifications/types/notification-draft';
import useNotificationOutletStore from '@/lib/notifications/use-notification-outlet-store';

import type { NotificationsPort } from './types/notifications-port';

const outletActions = new NotificationOutletActions(useNotificationOutletStore, () => Date.now());
const dismiss = outletActions.dismiss.bind(outletActions);
const dismissAll = outletActions.dismissAll.bind(outletActions);
const withdraw = outletActions.withdraw.bind(outletActions);
const publishFocus = outletActions.publishFocus.bind(outletActions);
const clear = outletActions.clear.bind(outletActions);

export default function useNotifications(): NotificationsPort {
  const { t } = useTranslation();
  const raise = useCallback(
    (drafts: NotificationDraftSet): void => outletActions.raise(drafts, t),
    [t]
  );

  return useMemo(
    (): NotificationsPort => ({ raise, dismiss, dismissAll, withdraw, publishFocus, clear }),
    [raise]
  );
}
