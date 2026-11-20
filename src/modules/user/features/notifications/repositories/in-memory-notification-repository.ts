import type {
  NotificationRecord,
  NotificationRecordDraftSet,
  NotificationRecordSet,
} from '../types/notification-record';
import type { NotificationRepository } from '../types/notification-repository';

export const NOTIFICATION_SEED: NotificationRecordSet = Object.freeze({
  items: Object.freeze([
    Object.freeze({
      id: 'seed-1',
      kind: 'success',
      messageKey: 'notification_center.seed.password_changed',
      createdAt: Date.parse('2026-11-10T09:15:00Z'),
      read: false,
    }),
    Object.freeze({
      id: 'seed-2',
      kind: 'success',
      messageKey: 'notification_center.seed.email_sent',
      createdAt: Date.parse('2026-11-09T16:40:00Z'),
      read: true,
    }),
    Object.freeze({
      id: 'seed-3',
      kind: 'success',
      messageKey: 'notification_center.seed.saved',
      createdAt: Date.parse('2026-11-08T11:05:00Z'),
      read: true,
    }),
  ]),
});

export class InMemoryNotificationRepository implements NotificationRepository {
  private entries: readonly NotificationRecord[];

  private sequence = 0;

  constructor(seed: NotificationRecordSet) {
    this.entries = seed.items;
  }

  public record(drafts: NotificationRecordDraftSet): Promise<NotificationRecordSet> {
    const first = this.sequence;
    const created = drafts.items.map((draft, index): NotificationRecord => ({
      id: `notification-${first + index + 1}`,
      kind: draft.kind,
      messageKey: draft.messageKey,
      createdAt: draft.createdAt,
      read: false,
    }));
    this.sequence += created.length;
    this.entries = [...this.entries, ...created];

    return Promise.resolve({ items: created });
  }

  public list(): Promise<NotificationRecordSet> {
    const newestFirst = [...this.entries].sort((left, right) => right.createdAt - left.createdAt);

    return Promise.resolve({ items: newestFirst });
  }

  public countUnread(): Promise<number> {
    return Promise.resolve(this.entries.filter((entry) => !entry.read).length);
  }

  public markAllRead(): Promise<void> {
    this.entries = this.entries.map((entry): NotificationRecord => ({ ...entry, read: true }));

    return Promise.resolve();
  }
}

export default new InMemoryNotificationRepository(NOTIFICATION_SEED);
