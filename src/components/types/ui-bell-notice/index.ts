import type { RefObject } from 'react';

import type { NotificationClose } from '@/components/types/ui-notification-content';
import type {
  NotificationView,
  NotificationViewSet,
} from '@/lib/notifications/types/notification-view';

export type NoticeTargetRef = RefObject<HTMLElement | null>;

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

export interface UIBellNoticeProps {
  readonly views: NotificationViewSet;
  readonly bellRef: NoticeTargetRef;
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
