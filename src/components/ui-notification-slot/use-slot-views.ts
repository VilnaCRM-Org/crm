import { useMemo } from 'react';

import useInlineBatch from '@/hooks/use-inline-batch';
import useNotificationFocus from '@/hooks/use-notification-focus';
import useNotificationViews from '@/hooks/use-notification-views';
import useNotifications from '@/hooks/use-notifications';
import type { NotificationAnchor } from '@/lib/notifications/types/notification-draft';
import type { NotificationFocusReturn } from '@/lib/notifications/types/notification-outlet-state';
import type {
  NotificationView,
  NotificationViewSet,
} from '@/lib/notifications/types/notification-view';

function usable(element: HTMLElement | null | undefined): HTMLElement | undefined {
  return element?.isConnected && !element.matches(':disabled') ? element : undefined;
}

function focusReturn(focus: NotificationFocusReturn | null): void {
  const target = usable(focus?.primary.current) ?? usable(focus?.fallback?.current);
  target?.focus();
}

export default function useSlotViews(anchor: NotificationAnchor): NotificationViewSet {
  const views = useNotificationViews(useInlineBatch(anchor));
  const focus = useNotificationFocus();
  const { withdraw } = useNotifications();

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
              focusReturn(focus);
              withdraw(anchor);
              action.onActivate();
            },
          },
        };
      }),
    }),
    [views, focus, withdraw, anchor]
  );
}
