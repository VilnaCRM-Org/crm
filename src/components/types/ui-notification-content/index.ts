import type { Ref } from 'react';

import type { NotificationKind } from '@/lib/notifications/types/notification-kind';
import type {
  NotificationView,
  NotificationViewAction,
} from '@/lib/notifications/types/notification-view';

export type NotificationIconKind = NotificationKind | 'close';

export interface NotificationIconProps {
  readonly kind: NotificationIconKind;
}

export type NotificationContentSize = 'toast' | 'inline';

export type NotificationClose = (id: string) => void;

export interface UINotificationContentProps {
  readonly view: NotificationView;
  readonly size?: NotificationContentSize | undefined;
  readonly onClose?: NotificationClose | undefined;
  readonly closeRef?: Ref<HTMLButtonElement> | undefined;
}

export interface NotificationContentTextProps {
  readonly view: NotificationView;
  readonly messageId: string;
  readonly size: NotificationContentSize;
}

export interface NotificationContentActionProps {
  readonly action: NotificationViewAction;
  readonly size: NotificationContentSize;
}

export interface NotificationContentCloseProps {
  readonly id: string;
  readonly describedBy: string;
  readonly size: NotificationContentSize;
  readonly closeRef?: Ref<HTMLButtonElement> | undefined;
  readonly onClose: NotificationClose;
}
