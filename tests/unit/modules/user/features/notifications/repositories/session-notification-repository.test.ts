import type { NotificationRepository } from '@/modules/user/features/notifications';
import { SessionNotificationRepository } from '@/modules/user/features/notifications/repositories';
import { buildNotificationRecordDraftSet, buildNotificationRecordSet } from '@tests/builders';

const drafts = buildNotificationRecordDraftSet(1);

const records = buildNotificationRecordSet(2);

const innerOf = (): jest.Mocked<NotificationRepository> => ({
  record: jest.fn().mockResolvedValue(records),
  list: jest.fn().mockResolvedValue(records),
  countUnread: jest.fn().mockResolvedValue(2),
  markAllRead: jest.fn().mockResolvedValue(undefined),
  claim: jest.fn().mockResolvedValue(undefined),
});

type Operation = (repository: NotificationRepository) => Promise<unknown>;

const OPERATIONS: readonly [string, keyof NotificationRepository, Operation, unknown][] = [
  ['record', 'record', (repository): Promise<unknown> => repository.record(drafts), records],
  ['list', 'list', (repository): Promise<unknown> => repository.list(), records],
  ['countUnread', 'countUnread', (repository): Promise<unknown> => repository.countUnread(), 2],
  [
    'markAllRead',
    'markAllRead',
    (repository): Promise<unknown> => repository.markAllRead(),
    undefined,
  ],
];

describe('SessionNotificationRepository', () => {
  it.each(OPERATIONS)('claims for its owner before %s', async (_name, method, run, answer) => {
    const inner = innerOf();
    let claimed: () => void = () => undefined;
    inner.claim.mockReturnValue(
      new Promise((resolve) => {
        claimed = resolve;
      })
    );

    const pending = run(new SessionNotificationRepository(inner, 'owner'));
    await Promise.resolve();
    expect(inner.claim).toHaveBeenCalledWith('owner');
    expect(inner[method]).not.toHaveBeenCalled();

    claimed();
    expect(await pending).toEqual(answer);
    expect(inner[method]).toHaveBeenCalledTimes(1);
  });

  it('hands the drafts over', async () => {
    const inner = innerOf();

    await new SessionNotificationRepository(inner, null).record(drafts);

    expect(inner.record).toHaveBeenCalledWith(drafts);
    expect(inner.claim).toHaveBeenCalledWith(null);
  });

  it('claims once for operations that start together and later', async () => {
    const inner = innerOf();
    const repository = new SessionNotificationRepository(inner, 'owner');

    await Promise.all([repository.list(), repository.countUnread()]);
    await repository.markAllRead();

    expect(inner.claim).toHaveBeenCalledTimes(1);
  });

  it.each(OPERATIONS)('rejects %s and touches nothing while the claim fails', async (...step) => {
    const [, method, run] = step;
    const inner = innerOf();
    const failure = new Error('claim failed');
    inner.claim.mockRejectedValue(failure);

    await expect(run(new SessionNotificationRepository(inner, 'owner'))).rejects.toBe(failure);

    expect(inner[method]).not.toHaveBeenCalled();
  });

  it('claims for its own owner and shares that claim with the operations', async () => {
    const inner = innerOf();
    const repository = new SessionNotificationRepository(inner, 'owner');

    await repository.claim('owner');
    await repository.list();

    expect(inner.claim).toHaveBeenCalledTimes(1);
    expect(inner.claim).toHaveBeenCalledWith('owner');
  });

  it.each(['another', null])('rejects a claim for the owner %s', async (owner) => {
    const inner = innerOf();

    await expect(new SessionNotificationRepository(inner, 'owner').claim(owner)).rejects.toThrow(
      'The session belongs to another owner'
    );

    expect(inner.claim).not.toHaveBeenCalled();
  });

  it('claims again for the next operation after a failed claim', async () => {
    const inner = innerOf();
    inner.claim.mockRejectedValueOnce(new Error('claim failed'));
    const repository = new SessionNotificationRepository(inner, 'owner');

    await expect(repository.list()).rejects.toThrow('claim failed');

    await expect(repository.list()).resolves.toEqual(records);
    expect(inner.claim).toHaveBeenCalledTimes(2);
  });
});
