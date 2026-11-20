import { useMemo } from 'react';

import type {
  NotificationView,
  NotificationViewSet,
} from '@/lib/notifications/types/notification-view';

import useNotificationFocusReturn from './use-notification-focus-return';

export default function useRetiringNotificationViews(
  views: NotificationViewSet,
  retire: (view: NotificationView) => void
): NotificationViewSet {
  const focusReturn = useNotificationFocusReturn();

  return useMemo(
    (): NotificationViewSet => ({
      items: views.items.map((view): NotificationView => {
        const { action } = view;
        if (action === undefined) return view;

        return {
          ...view,
          action: {
            label: action.label,
            onActivate: (): void => {
              focusReturn();
              retire(view);
              action.onActivate();
            },
          },
        };
      }),
    }),
    [views, focusReturn, retire]
  );
}
