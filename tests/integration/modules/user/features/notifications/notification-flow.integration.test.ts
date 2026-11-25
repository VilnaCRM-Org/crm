import { act, renderHook, waitFor } from '@testing-library/react';

import useNotificationAnnouncement from '@/hooks/use-notification-announcement';
import useNotifications from '@/hooks/use-notifications';
import '@/i18n';
import type { NotificationDraft } from '@/lib/notifications/types/notification-draft';
import useNotificationOutletStore from '@/lib/notifications/use-notification-outlet-store';
import useHistory from '@/modules/user/features/notifications/hooks/use-notification-history';
import useRecorder from '@/modules/user/features/notifications/hooks/use-notification-recorder';
import {
  inMemoryNotificationRepository,
  InMemoryNotificationRepository,
  NOTIFICATION_SEED,
  SessionNotificationRepository,
} from '@/modules/user/features/notifications/repositories';
import { buildEmail } from '@tests/builders';
import { resetClientStores } from '@tests/utils/reset-client-stores';

type Port = ReturnType<typeof useNotifications>;
type History = ReturnType<typeof useHistory>;

interface Flow {
  readonly port: Port;
  readonly history: History;
  readonly polite: string;
  readonly assertive: string;
}

const saved: NotificationDraft = { kind: 'success', messageKey: 'settings.toasts.saved' };
const failed: NotificationDraft = {
  kind: 'error',
  messageKey: 'settings.toasts.save_failed_transient',
};

const mount = (report = jest.fn()): { current: Flow } =>
  renderHook((): Flow => {
    const port = useNotifications();
    const history = useHistory(useRecorder(report), report);

    return { port, history, ...useNotificationAnnouncement() };
  }).result;

const unreadBecomes = (flow: { current: Flow }, change: number, from: number): Promise<void> =>
  waitFor(() => expect(flow.current.history.unread).toBe(from + change));

describe('notification flow from a raised outcome into the history', () => {
  beforeEach(() => resetClientStores());

  afterEach(() => jest.restoreAllMocks());

  it('announces, shows and records one outcome once, newest first', async () => {
    const before = await inMemoryNotificationRepository.countUnread();
    const flow = mount();
    const record = jest.spyOn(inMemoryNotificationRepository, 'record');

    act(() => flow.current.port.raise({ items: [saved] }));

    await unreadBecomes(flow, 1, before);
    const { raised, shown } = useNotificationOutletStore.getState();
    expect(shown).toEqual(raised);
    expect(flow.current.polite).toContain(saved.messageKey);
    expect(flow.current.assertive).toBe('');
    expect(record).toHaveBeenCalledTimes(1);
    expect(flow.current.history.records.items[0]).toMatchObject({
      kind: 'success',
      messageKey: saved.messageKey,
      createdAt: raised.items[0]?.raisedAt,
      read: false,
    });
  });

  it('announces a failure assertively and repeats it with the alternating mark', async () => {
    const before = await inMemoryNotificationRepository.countUnread();
    const flow = mount();

    act(() => flow.current.port.raise({ items: [failed] }));
    const first = flow.current.assertive;
    act(() => flow.current.port.raise({ items: [failed] }));

    expect(first).toContain(failed.messageKey);
    expect(flow.current.assertive).toContain(failed.messageKey);
    expect(flow.current.assertive).not.toBe(first);
    expect(flow.current.polite).toBe('');
    await unreadBecomes(flow, 2, before);
  });

  it('keeps showing an outcome whose record is rejected, and reports it', async () => {
    const before = await inMemoryNotificationRepository.countUnread();
    const failure = new Error('record failed');
    jest.spyOn(inMemoryNotificationRepository, 'record').mockRejectedValue(failure);
    const report = jest.fn();
    const flow = mount(report);

    act(() => flow.current.port.raise({ items: [saved] }));

    await waitFor(() =>
      expect(report).toHaveBeenCalledWith('app-shell:notifications-record', failure)
    );
    expect(useNotificationOutletStore.getState().shown.items).toHaveLength(1);
    expect(await inMemoryNotificationRepository.countUnread()).toBe(before);
  });

  it('records the outcome raised before the bell slot mounted', async () => {
    const before = await inMemoryNotificationRepository.countUnread();
    const port = renderHook(() => useNotifications()).result;
    act(() => port.current.raise({ items: [saved] }));

    const flow = mount();

    await waitFor(() => expect(flow.current.history.unread).toBe(before + 1));
  });

  it('records every batch raised before the history is mounted', async () => {
    const before = await inMemoryNotificationRepository.countUnread();
    const port = renderHook(() => useNotifications()).result;
    act(() => port.current.raise({ items: [saved] }));
    act(() => port.current.raise({ items: [failed] }));

    const flow = mount();

    await waitFor(() => expect(flow.current.history.unread).toBe(before + 2));
  });

  it('reports a history that cannot be read or marked read', async () => {
    const failure = new Error('repository failed');
    jest.spyOn(inMemoryNotificationRepository, 'list').mockRejectedValue(failure);
    jest.spyOn(inMemoryNotificationRepository, 'markAllRead').mockRejectedValue(failure);
    const report = jest.fn();
    const flow = mount(report);

    await waitFor(() =>
      expect(report).toHaveBeenCalledWith('app-shell:notifications-list', failure)
    );
    await act(async () => flow.current.history.markAllRead());

    expect(report).toHaveBeenCalledWith('app-shell:notifications-mark-read', failure);
    expect(flow.current.history.records.items).toEqual([]);
  });

  it('drops the shown outcomes on dismissal and on leaving, and keeps them unread', async () => {
    const before = await inMemoryNotificationRepository.countUnread();
    const flow = mount();
    const shown = (): number => useNotificationOutletStore.getState().shown.items.length;
    const focus = { primary: { current: null } };

    act(() => flow.current.port.publishFocus(focus));
    act(() => flow.current.port.raise({ items: [saved, failed] }));
    expect(useNotificationOutletStore.getState().focus).toBe(focus);
    act(() =>
      flow.current.port.dismiss(useNotificationOutletStore.getState().shown.items[0]?.id ?? 0)
    );
    expect(shown()).toBe(1);
    act(() => flow.current.port.dismissAll());
    expect(shown()).toBe(0);
    act(() => flow.current.port.clear());

    expect(useNotificationOutletStore.getState().focus).toBeNull();
    expect(flow.current.polite).toBe('');
    await unreadBecomes(flow, 2, before);
  });

  it('marks everything read and keeps no address in the records or in storage', async () => {
    const email = buildEmail();
    const before = await inMemoryNotificationRepository.countUnread();
    const flow = mount();

    const addressed = { ...saved, email, message: email };
    act(() => flow.current.port.raise({ items: [addressed] }));
    expect(JSON.stringify(useNotificationOutletStore.getState().raised)).toContain(email);
    await unreadBecomes(flow, 1, before);
    await act(async () => flow.current.history.markAllRead());

    expect(flow.current.history.unread).toBe(0);
    expect(JSON.stringify(flow.current.history.records)).not.toContain(email);
    expect(window.localStorage).toHaveLength(0);
    expect(window.sessionStorage).toHaveLength(0);
  });

  it('keeps what a session recorded and read from the next one', async () => {
    const repository = new InMemoryNotificationRepository(NOTIFICATION_SEED);
    await repository.claim('first');
    await repository.record({ items: [{ ...saved, createdAt: Date.now() }] });
    await repository.claim('first');
    expect(await repository.countUnread()).toBe(2);

    await repository.markAllRead();
    await repository.claim('second');

    expect((await repository.list()).items).toHaveLength(NOTIFICATION_SEED.items.length);
    expect(await repository.countUnread()).toBe(1);
  });

  it('reads and writes for a session only once it claimed the history', async () => {
    const repository = new InMemoryNotificationRepository(NOTIFICATION_SEED);
    const claim = jest.spyOn(repository, 'claim').mockRejectedValueOnce(new Error('claim failed'));
    const session = new SessionNotificationRepository(repository, 'first');

    await expect(session.list()).rejects.toThrow('claim failed');
    await session.record({ items: [{ ...saved, createdAt: Date.now() }] });
    expect(await session.countUnread()).toBe(2);
    await session.markAllRead();

    expect((await session.list()).items).toHaveLength(NOTIFICATION_SEED.items.length + 1);
    expect(await session.countUnread()).toBe(0);
    expect(claim).toHaveBeenCalledTimes(2);
    const next = new SessionNotificationRepository(repository, 'second');
    await expect(next.claim('first')).rejects.toThrow('The session belongs to another owner');
    await next.claim('second');
    expect(await next.countUnread()).toBe(1);
  });

  it('starts a fresh document from the seed alone', async () => {
    const repository = new InMemoryNotificationRepository(NOTIFICATION_SEED);

    expect((await repository.list()).items).toHaveLength(NOTIFICATION_SEED.items.length);
    expect(await repository.countUnread()).toBe(1);
  });
});
