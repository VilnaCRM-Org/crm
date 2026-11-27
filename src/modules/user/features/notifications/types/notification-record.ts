import type {
  NotificationMessageKey,
  NotificationMessageValues,
} from '@/lib/notifications/types/notification-draft';
import type { NotificationKind } from '@/lib/notifications/types/notification-kind';

export interface NotificationRecord {
  readonly id: string;
  readonly kind: NotificationKind;
  readonly messageKey: NotificationMessageKey;
  readonly messageValues?: NotificationMessageValues | undefined;
  readonly createdAt: number;
  readonly read: boolean;
}

export interface NotificationRecordSet {
  readonly items: readonly NotificationRecord[];
}

export interface NotificationRecordDraft {
  readonly kind: NotificationKind;
  readonly messageKey: NotificationMessageKey;
  readonly messageValues?: NotificationMessageValues | undefined;
  readonly createdAt: number;
}

export interface NotificationRecordDraftSet {
  readonly items: readonly NotificationRecordDraft[];
}
