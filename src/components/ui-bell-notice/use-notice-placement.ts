import type { NoticeTargetRef } from '@/components/types/ui-bell-notice';
import type { NotificationViewSet } from '@/lib/notifications/types/notification-view';

import useBellAnchor from './use-bell-anchor';
import useNoticeClearance from './use-notice-clearance';

export default function useNoticePlacement(
  bellRef: NoticeTargetRef,
  cardRef: NoticeTargetRef,
  rows: NotificationViewSet
): void {
  useBellAnchor(bellRef);
  useNoticeClearance(cardRef, rows);
}
