import { act, renderHook } from '@testing-library/react';

import useHistory from '@/modules/user/features/notifications/hooks/use-notification-history';
import {
  InMemoryNotificationRepository,
  NOTIFICATION_SEED,
} from '@/modules/user/features/notifications/repositories';
import { buildNotificationRecordDraftSet } from '@tests/builders';

let mockRepository = new InMemoryNotificationRepository(NOTIFICATION_SEED);

jest.mock('@/modules/user/features/notifications/hooks/use-notification-repository', () => ({
  __esModule: true,
  default: (): typeof mockRepository => mockRepository,
}));

const SEED_IDS = ['seed-1', 'seed-2', 'seed-3'];

describe('useNotificationHistory', () => {
  const report = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockRepository = new InMemoryNotificationRepository(NOTIFICATION_SEED);
  });

  it('starts empty and loads the seed newest first with one unread on mount', async () => {
    const { result } = renderHook(() => useHistory(0, report));
    expect(result.current.records.items).toEqual([]);
    expect(result.current.unread).toBe(0);

    await act(async () => undefined);

    expect(result.current.records.items.map((record) => record.id)).toEqual(SEED_IDS);
    expect(result.current.unread).toBe(1);
  });

  it('refreshes to four unread when the revision grows after a recorded raise', async () => {
    const { result, rerender } = renderHook(({ revision }) => useHistory(revision, report), {
      initialProps: { revision: 0 },
    });
    await act(async () => undefined);

    await act(async () => {
      await mockRepository.record(buildNotificationRecordDraftSet(3, { createdAt: Date.now() }));
    });
    expect(result.current.unread).toBe(1);

    rerender({ revision: 1 });
    await act(async () => undefined);

    expect(result.current.unread).toBe(4);
    expect(result.current.records.items).toHaveLength(6);
  });

  it('does not reload when nothing changed on a re-render', async () => {
    const list = jest.spyOn(mockRepository, 'list');
    const { rerender } = renderHook(() => useHistory(0, report));
    await act(async () => undefined);

    rerender();
    await act(async () => undefined);

    expect(list).toHaveBeenCalledTimes(1);
  });

  it('marks every record read and refreshes by itself', async () => {
    const { result } = renderHook(() => useHistory(0, report));
    await act(async () => undefined);
    expect(result.current.unread).toBe(1);

    await act(async () => result.current.markAllRead());

    expect(result.current.unread).toBe(0);
    expect(result.current.records.items.every((record) => record.read)).toBe(true);
  });

  it('reloads on demand through refresh', async () => {
    const { result } = renderHook(() => useHistory(0, report));
    await act(async () => undefined);
    await act(async () => {
      await mockRepository.record(buildNotificationRecordDraftSet(1, { createdAt: Date.now() }));
    });
    expect(result.current.unread).toBe(1);

    await act(async () => result.current.refresh());

    expect(result.current.unread).toBe(2);
  });

  it.each(['list', 'countUnread'] as const)(
    'reports a rejected %s once and keeps the last snapshot',
    async (operation) => {
      const failure = new Error('read failed');
      const { result, rerender } = renderHook(({ revision }) => useHistory(revision, report), {
        initialProps: { revision: 0 },
      });
      await act(async () => undefined);
      const { records, unread } = result.current;
      expect(report).not.toHaveBeenCalled();
      jest.spyOn(mockRepository, operation).mockRejectedValue(failure);

      rerender({ revision: 1 });
      await act(async () => undefined);

      expect(report).toHaveBeenCalledTimes(1);
      expect(report).toHaveBeenCalledWith('app-shell:notifications-list', failure);
      expect(result.current.records).toBe(records);
      expect(result.current.unread).toBe(unread);
    }
  );

  it('reports a rejected markAllRead once, keeps the rows unread and does not reload', async () => {
    const failure = new Error('write failed');
    const list = jest.spyOn(mockRepository, 'list');
    jest.spyOn(mockRepository, 'markAllRead').mockRejectedValue(failure);
    const { result } = renderHook(() => useHistory(0, report));
    await act(async () => undefined);

    await act(async () => result.current.markAllRead());

    expect(report).toHaveBeenCalledTimes(1);
    expect(report).toHaveBeenCalledWith('app-shell:notifications-mark-read', failure);
    expect(result.current.unread).toBe(1);
    expect(list).toHaveBeenCalledTimes(1);
  });

  it('reports the reload that fails after a successful markAllRead as a read failure', async () => {
    const failure = new Error('read failed');
    const { result } = renderHook(() => useHistory(0, report));
    await act(async () => undefined);
    jest.spyOn(mockRepository, 'list').mockRejectedValue(failure);

    await act(async () => result.current.markAllRead());

    expect(report.mock.calls).toEqual([['app-shell:notifications-list', failure]]);
  });

  it('uses the latest report handler', async () => {
    const failure = new Error('failed');
    const latest = jest.fn();
    const { result, rerender } = renderHook(({ handler }) => useHistory(0, handler), {
      initialProps: { handler: report },
    });
    await act(async () => undefined);
    jest.spyOn(mockRepository, 'markAllRead').mockRejectedValue(failure);
    jest.spyOn(mockRepository, 'list').mockRejectedValue(failure);

    rerender({ handler: latest });
    await act(async () => result.current.markAllRead());

    expect(latest).toHaveBeenCalledWith('app-shell:notifications-list', failure);
    expect(latest).toHaveBeenCalledWith('app-shell:notifications-mark-read', failure);
    expect(report).not.toHaveBeenCalled();
  });

  it('keeps the same markAllRead and refresh identities across renders', async () => {
    const { result, rerender } = renderHook(() => useHistory(0, report));
    await act(async () => undefined);
    const { markAllRead, refresh } = result.current;

    rerender();

    expect(result.current.markAllRead).toBe(markAllRead);
    expect(result.current.refresh).toBe(refresh);
  });
});
