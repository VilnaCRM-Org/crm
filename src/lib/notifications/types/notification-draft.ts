import type { NotificationKind } from './notification-kind';

export type NotificationMessageKey = string;

export interface NotificationMessageValue {
  readonly name: string;
  readonly value: string;
}

export interface NotificationMessageValues {
  readonly items: readonly NotificationMessageValue[];
}

export type NotificationActivate = () => void;

export interface NotificationAction {
  readonly labelKey: NotificationMessageKey;
  readonly onActivate: NotificationActivate;
}

export interface NotificationDraft {
  readonly kind: NotificationKind;
  readonly messageKey: NotificationMessageKey;
  readonly messageValues?: NotificationMessageValues | undefined;
  readonly action?: NotificationAction | undefined;
}

export interface NotificationDraftSet {
  readonly items: readonly NotificationDraft[];
}
