import useRepo from '@/modules/user/features/notifications/hooks/use-notification-repository';
import { inMemoryNotificationRepository } from '@/modules/user/features/notifications/repositories';

describe('useNotificationRepository', () => {
  it('returns the singleton adapter every time', () => {
    expect(useRepo()).toBe(inMemoryNotificationRepository);
    expect(useRepo()).toBe(useRepo());
  });

  it('serves the contract: the seeded history is listed with one unread', async () => {
    const repository = useRepo();

    expect((await repository.list()).items.map((record) => record.id)).toEqual([
      'seed-1',
      'seed-2',
      'seed-3',
    ]);
    expect(await repository.countUnread()).toBe(1);
  });
});
