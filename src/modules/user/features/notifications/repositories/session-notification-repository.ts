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
    await this.claimOnce();

    return this.repository.record(drafts);
  }

  public async list(): Promise<NotificationRecordSet> {
    await this.claimOnce();

    return this.repository.list();
  }

  public async countUnread(): Promise<number> {
    await this.claimOnce();

    return this.repository.countUnread();
  }

  public async markAllRead(): Promise<void> {
    await this.claimOnce();

    return this.repository.markAllRead();
  }

  public claim(owner: string | null): Promise<void> {
    return owner === this.owner
      ? this.claimOnce()
      : Promise.reject(new Error('The session belongs to another owner'));
  }

  private claimOnce(): Promise<void> {
    this.claiming ??= this.repository.claim(this.owner).catch((error: unknown) => {
      this.claiming = null;
      throw error;
    });

    return this.claiming;
  }
}
