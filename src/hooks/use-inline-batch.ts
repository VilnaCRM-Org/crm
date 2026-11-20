import { useMemo } from 'react';

import { CLEARED_NOTIFICATION_OUTLET } from '@/lib/notifications/cleared-notification-outlet';
import PRIMARY_NOTIFICATION_ANCHOR from '@/lib/notifications/notification-anchors';
import type { NotificationAnchor } from '@/lib/notifications/types/notification-draft';
import type { NotificationOutletState } from '@/lib/notifications/types/notification-outlet-state';
import type { ShownNotificationSet } from '@/lib/notifications/types/shown-notification';
import useNotificationOutletStore from '@/lib/notifications/use-notification-outlet-store';

import useShownNotifications from './use-shown-notifications';

export default function useInlineBatch(anchor: NotificationAnchor): ShownNotificationSet {
  const shown = useShownNotifications();
  const inline = useNotificationOutletStore((state: NotificationOutletState) => state.inline);

  return useMemo((): ShownNotificationSet => {
    const latest = inline.items.find((entry) => entry.anchor === anchor);
    if (latest === undefined) return CLEARED_NOTIFICATION_OUTLET.shown;

    return {
      items: shown.items.filter(
        (item) =>
          item.batch === latest.batch && (item.anchor ?? PRIMARY_NOTIFICATION_ANCHOR) === anchor
      ),
    };
  }, [shown, inline, anchor]);
}
