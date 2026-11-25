import type { NotificationRecord } from '@/modules/user/features/notifications';
import inMemoryNotificationRepository, {
  InMemoryNotificationRepository,
  NOTIFICATION_SEED,
} from '@/modules/user/features/notifications/repositories/in-memory-notification-repository';
import {
  buildNotificationRecordDraft,
  buildNotificationRecordDraftSet,
  buildNotificationRecordSet,
} from '@tests/builders';
import loadIsolated from '@tests/unit/utils/isolated-module';

const TEN_MINUTES_MS = 10 * 60 * 1000;
const AFTER_SEED = Date.parse('2026-11-20T08:00:00Z');

const SEED_ROWS: readonly NotificationRecord[] = [
  {
    id: 'seed-1',
    kind: 'success',
    messageKey: 'notification_center.seed.password_changed',
    createdAt: Date.parse('2026-11-10T09:15:00Z'),
    read: false,
  },
  {
    id: 'seed-2',
    kind: 'success',
    messageKey: 'notification_center.seed.email_sent',
    createdAt: Date.parse('2026-11-09T16:40:00Z'),
    read: true,
  },
  {
    id: 'seed-3',
    kind: 'success',
    messageKey: 'notification_center.seed.saved',
    createdAt: Date.parse('2026-11-08T11:05:00Z'),
    read: true,
  },
];

const expectMicrotask = async (run: () => Promise<unknown>): Promise<void> => {
  let settled = false;
  const pending = run().then(() => {
    settled = true;
  });

  expect(settled).toBe(false);
  await pending;
  expect(settled).toBe(true);
};

const fresh = (): InMemoryNotificationRepository =>
  new InMemoryNotificationRepository(NOTIFICATION_SEED);

describe('InMemoryNotificationRepository', () => {
  afterEach(() => jest.useRealTimers());

  describe('the seed', () => {
    it('lists three success rows newest first with one unread', async () => {
      const repository = fresh();

      expect((await repository.list()).items).toEqual(SEED_ROWS);
      expect(await repository.countUnread()).toBe(1);
    });

    it('is frozen at every level', () => {
      expect(Object.isFrozen(NOTIFICATION_SEED)).toBe(true);
      expect(Object.isFrozen(NOTIFICATION_SEED.items)).toBe(true);
      NOTIFICATION_SEED.items.forEach((record) => expect(Object.isFrozen(record)).toBe(true));
    });

    it('is evaluated in a freshly loaded module with the class and instance', async () => {
      const loaded = await loadIsolated(
        () => import('@/modules/user/features/notifications/repositories')
      );

      expect(loaded.inMemoryNotificationRepository).toBeInstanceOf(
        loaded.InMemoryNotificationRepository
      );
      expect((await loaded.inMemoryNotificationRepository.list()).items).toEqual(SEED_ROWS);
      expect((await fresh().list()).items).toEqual(SEED_ROWS);
      expect(loaded.NOTIFICATION_SEED.items).toEqual(SEED_ROWS);
    });

    it('is the same data the default instance starts from', async () => {
      expect(inMemoryNotificationRepository).toBeInstanceOf(InMemoryNotificationRepository);
      expect((await inMemoryNotificationRepository.list()).items).toEqual(
        (await fresh().list()).items
      );
    });
  });

  describe('record', () => {
    it('returns three unread records with sequential ids and the draft fields', async () => {
      const repository = fresh();
      const drafts = buildNotificationRecordDraftSet(3, { createdAt: AFTER_SEED });

      const recorded = await repository.record(drafts);

      expect(recorded.items).toEqual(
        drafts.items.map((draft, index) => ({
          id: `notification-${index + 1}`,
          kind: draft.kind,
          messageKey: draft.messageKey,
          createdAt: AFTER_SEED,
          read: false,
        }))
      );
    });

    it('lists the new records first, in insertion order for equal instants', async () => {
      const repository = fresh();
      const drafts = buildNotificationRecordDraftSet(3, { createdAt: AFTER_SEED });

      await repository.record(drafts);

      const listed = (await repository.list()).items;
      expect(listed.map((record) => record.id)).toEqual([
        'notification-1',
        'notification-2',
        'notification-3',
        'seed-1',
        'seed-2',
        'seed-3',
      ]);
      expect(await repository.countUnread()).toBe(4);
    });

    it('sorts by instant, newest first, whatever order the records arrive in', async () => {
      const repository = fresh();
      const older = buildNotificationRecordDraft({ createdAt: Date.parse('2026-11-01T00:00:00Z') });
      const newer = buildNotificationRecordDraft({ createdAt: AFTER_SEED });

      await repository.record({ items: [older] });
      await repository.record({ items: [newer] });

      expect((await repository.list()).items.map((record) => record.id)).toEqual([
        'notification-2',
        'seed-1',
        'seed-2',
        'seed-3',
        'notification-1',
      ]);
    });

    it('continues the id sequence across calls', async () => {
      const repository = fresh();

      await repository.record(buildNotificationRecordDraftSet(2));
      const second = await repository.record(buildNotificationRecordDraftSet(1));

      expect(second.items.map((record) => record.id)).toEqual(['notification-3']);
    });

    it('records an empty set as nothing', async () => {
      const repository = fresh();

      expect((await repository.record({ items: [] })).items).toEqual([]);
      expect((await repository.list()).items).toEqual(SEED_ROWS);
    });

    it('keeps only id, kind, messageKey, createdAt and read on a record', async () => {
      const repository = fresh();

      const [record] = (await repository.record(buildNotificationRecordDraftSet(1))).items;

      expect(Object.keys(record ?? {}).sort()).toEqual([
        'createdAt',
        'id',
        'kind',
        'messageKey',
        'read',
      ]);
    });
  });

  describe('markAllRead', () => {
    it('marks every listed record read and zeroes the unread count', async () => {
      const repository = fresh();
      await repository.record(buildNotificationRecordDraftSet(3));
      expect(await repository.countUnread()).toBe(4);

      await repository.markAllRead();

      expect(await repository.countUnread()).toBe(0);
      expect((await repository.list()).items.every((record) => record.read)).toBe(true);
    });

    it('resolves with no value and leaves the ids and texts alone', async () => {
      const repository = fresh();

      await expect(repository.markAllRead()).resolves.toBeUndefined();

      expect(
        (await repository.list()).items.map(({ id, messageKey }) => ({ id, messageKey }))
      ).toEqual(SEED_ROWS.map(({ id, messageKey }) => ({ id, messageKey })));
    });

    it('does not touch the frozen seed', async () => {
      const repository = fresh();

      await repository.markAllRead();

      expect(NOTIFICATION_SEED.items[0]?.read).toBe(false);
    });
  });

  describe('state and side effects', () => {
    it('keeps each instance independent of every other', async () => {
      const first = fresh();
      const second = fresh();

      await first.record(buildNotificationRecordDraftSet(2));
      await first.markAllRead();

      expect((await second.list()).items).toEqual(SEED_ROWS);
      expect(await second.countUnread()).toBe(1);
    });

    it('starts from any seed it is given', async () => {
      const seed = buildNotificationRecordSet(2, { read: false });
      const repository = new InMemoryNotificationRepository(seed);

      expect(await repository.countUnread()).toBe(2);
      expect((await repository.list()).items).toHaveLength(2);
    });

    it('starts from the seed and from its first id when another session claims it', async () => {
      const repository = fresh();
      await repository.claim('first');
      const first = await repository.record(buildNotificationRecordDraftSet(2));
      await repository.markAllRead();

      await repository.claim('second');

      expect((await repository.list()).items).toEqual(SEED_ROWS);
      expect(await repository.countUnread()).toBe(1);
      const again = await repository.record(buildNotificationRecordDraftSet(2));
      expect(again.items.map((item) => item.id)).toEqual(first.items.map((item) => item.id));
    });

    it('starts from the seed when a session claims what an unclaimed one recorded', async () => {
      const repository = fresh();
      await repository.record(buildNotificationRecordDraftSet(1));

      await repository.claim('first');

      expect((await repository.list()).items).toEqual(SEED_ROWS);
    });

    it('keeps an unclaimed history when a session without a token claims it', async () => {
      const repository = fresh();
      await repository.record(buildNotificationRecordDraftSet(1));

      await repository.claim(null);

      expect((await repository.list()).items).toHaveLength(SEED_ROWS.length + 1);
      const next = await repository.record(buildNotificationRecordDraftSet(1));
      expect(next.items.map((item) => item.id)).toEqual(['notification-2']);
    });

    it('keeps every record and read mark when the same session claims it again', async () => {
      const repository = fresh();
      await repository.claim('first');
      await repository.record(buildNotificationRecordDraftSet(2));
      await repository.markAllRead();

      await repository.claim('first');

      expect((await repository.list()).items).toHaveLength(SEED_ROWS.length + 2);
      expect(await repository.countUnread()).toBe(0);
      const next = await repository.record(buildNotificationRecordDraftSet(1));
      expect(next.items.map((item) => item.id)).toEqual(['notification-3']);
    });

    it('resolves every operation on a microtask', async () => {
      const repository = fresh();

      await expectMicrotask(() => repository.record(buildNotificationRecordDraftSet(1)));
      await expectMicrotask(() => repository.list());
      await expectMicrotask(() => repository.countUnread());
      await expectMicrotask(() => repository.markAllRead());
      await expectMicrotask(() => repository.claim('first'));
    });

    it('never calls fetch, XMLHttpRequest, localStorage or sessionStorage', async () => {
      const fetchSpy = jest.fn();
      const xhrSpy = jest.fn();
      const originalFetch = window.fetch;
      const originalXhr = window.XMLHttpRequest;
      window.fetch = fetchSpy;
      window.XMLHttpRequest = xhrSpy as unknown as typeof XMLHttpRequest;
      const storage = ['getItem', 'setItem', 'removeItem', 'clear', 'key'].map((method) =>
        jest.spyOn(Storage.prototype, method as 'getItem')
      );
      const repository = fresh();

      await repository.record(buildNotificationRecordDraftSet(2));
      await repository.list();
      await repository.countUnread();
      await repository.markAllRead();
      await repository.claim('first');
      window.fetch = originalFetch;
      window.XMLHttpRequest = originalXhr;

      expect(fetchSpy).not.toHaveBeenCalled();
      expect(xhrSpy).not.toHaveBeenCalled();
      storage.forEach((spy) => {
        expect(spy).not.toHaveBeenCalled();
        spy.mockRestore();
      });
    });

    it('marks nothing read and removes nothing as time passes', async () => {
      jest.useFakeTimers();
      const repository = fresh();

      jest.advanceTimersByTime(TEN_MINUTES_MS);

      expect((await repository.list()).items).toEqual(SEED_ROWS);
      expect(await repository.countUnread()).toBe(1);
      expect(jest.getTimerCount()).toBe(0);
    });
  });
});
