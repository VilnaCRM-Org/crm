import type { NotificationRecordDraftSet, NotificationRecordSet } from './notification-record';

export interface NotificationRepository {
  record(drafts: NotificationRecordDraftSet): Promise<NotificationRecordSet>;
  list(): Promise<NotificationRecordSet>;
  countUnread(): Promise<number>;
  markAllRead(): Promise<void>;
  claim(owner: string | null): Promise<void>;
}
