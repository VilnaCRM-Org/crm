import type { NotificationKind } from './notification-kind';

export type NotificationMessageKey = string;

export type NotificationAnchor = string;

export type NotificationActivate = () => void;

export interface NotificationAction {
  readonly labelKey: NotificationMessageKey;
  readonly onActivate: NotificationActivate;
}

export interface NotificationDraft {
  readonly kind: NotificationKind;
  readonly messageKey: NotificationMessageKey;
  readonly action?: NotificationAction | undefined;
  readonly anchor?: NotificationAnchor | undefined;
}

export interface NotificationDraftSet {
  readonly items: readonly NotificationDraft[];
}
