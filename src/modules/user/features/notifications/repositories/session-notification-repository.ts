import type {
  NotificationRecordDraftSet,
  NotificationRecordSet,
} from '../types/notification-record';
import type { NotificationRepository } from '../types/notification-repository';

export default class SessionNotificationRepository implements NotificationRepository {
  private claiming: Promise<void> | null = null;

  constructor(
    private readonly repository: NotificationRepository,
    private readonly owner: string | null
  ) {}

  public async record(drafts: NotificationRecordDraftSet): Promise<NotificationRecordSet> {
    await this.claim(this.owner);

    return this.repository.record(drafts);
  }

  public async list(): Promise<NotificationRecordSet> {
    await this.claim(this.owner);

    return this.repository.list();
  }

  public async countUnread(): Promise<number> {
    await this.claim(this.owner);

    return this.repository.countUnread();
  }

  public async markAllRead(): Promise<void> {
    await this.claim(this.owner);

    return this.repository.markAllRead();
  }

  public claim(owner: string | null): Promise<void> {
    this.claiming ??= this.repository.claim(owner).catch((error: unknown) => {
      this.claiming = null;
      throw error;
    });

    return this.claiming;
  }
}
