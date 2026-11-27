import type { NotificationRecordSet } from './notification-record';

export interface NotificationHistorySnapshot {
  readonly records: NotificationRecordSet;
  readonly unread: number;
}

export interface NotificationHistory {
  readonly records: NotificationRecordSet;
  readonly unread: number;
  readonly markAllRead: () => Promise<void>;
  readonly refresh: () => Promise<void>;
}
