import type { NotificationActivate } from './notification-draft';
import type { NotificationKind } from './notification-kind';

export interface NotificationViewAction {
  readonly label: string;
  readonly onActivate: NotificationActivate;
}

export interface NotificationView {
  readonly id: string;
  readonly kind: NotificationKind;
  readonly message: string;
  readonly action?: NotificationViewAction | undefined;
  readonly time?: string | undefined;
}

export interface NotificationViewSet {
  readonly items: readonly NotificationView[];
}
