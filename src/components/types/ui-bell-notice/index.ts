import type { RefObject } from 'react';

import type { NotificationClose } from '@/components/types/ui-notification-content';
import type {
  NotificationView,
  NotificationViewSet,
} from '@/lib/notifications/types/notification-view';
import type { ShownNotificationSet } from '@/lib/notifications/types/shown-notification';

export type NoticeTargetRef = RefObject<HTMLElement | null>;

export interface BellAnchorMoment {
  readonly expanded: boolean;
  readonly rows: ShownNotificationSet;
}

export type NoticeCloseRegistry = RefObject<Map<string, HTMLButtonElement>>;

export interface NoticeFocusTargets {
  readonly views: NotificationViewSet;
  readonly returnFocusRef: NoticeTargetRef;
  readonly fallbackFocusRef?: NoticeTargetRef | undefined;
}

export interface NoticeFocusOptions extends NoticeFocusTargets {
  readonly onDismiss: NotificationClose;
}

export type NoticeRelease = (id: string, node: HTMLButtonElement) => void;

export interface NoticeFocus {
  readonly registry: NoticeCloseRegistry;
  readonly dismiss: NotificationClose;
  readonly release: NoticeRelease;
}

export type FollowedEvent = 'focusin' | 'resize';

export interface UIBellNoticeProps {
  readonly views: NotificationViewSet;
  readonly returnFocusRef: NoticeTargetRef;
  readonly fallbackFocusRef?: NoticeTargetRef | undefined;
  readonly onDismiss: NotificationClose;
}

export interface NoticeRowProps {
  readonly view: NotificationView;
  readonly focus: NoticeFocus;
}

export interface NoticeListProps {
  readonly views: NotificationViewSet;
  readonly focus: NoticeFocus;
}
