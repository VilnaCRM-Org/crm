import { act, renderHook, waitFor } from '@testing-library/react';
import type { JSX, ReactNode } from 'react';

import useBroadcastEvents from '@/modules/user/features/notifications/hooks/use-broadcast-events';
import * as seam from '@/modules/user/features/notifications/hooks/use-notification-repository';
import { InMemoryNotificationRepository } from '@/modules/user/features/notifications/repositories';
import { buildBroadcastEvent } from '@tests/builders/broadcast-event';
import FakeEventSource from '@tests/unit/utils/fake-event-source';
import { clearConfigBlock, writeConfigBlock } from '@tests/utils/config-block';

const { NotificationRepositoryContext: RepositoryContext } = seam;

const setup = (
  repository = new InMemoryNotificationRepository({ items: [] })
): {
  repository: InMemoryNotificationRepository;
  report: jest.Mock;
  view: ReturnType<typeof renderHook<number, unknown>>;
} => {
  const report = jest.fn();
  const wrapper = ({ children }: { children: ReactNode }): JSX.Element => (
    <RepositoryContext value={repository}>{children}</RepositoryContext>
  );
  return { repository, report, view: renderHook(() => useBroadcastEvents(report), { wrapper }) };
};

const send = (): void => FakeEventSource.last().send(JSON.stringify(buildBroadcastEvent()));

describe('useBroadcastEvents', () => {
  beforeEach(() => {
    FakeEventSource.opened = [];
    Object.defineProperty(window, 'EventSource', { configurable: true, value: FakeEventSource });
    writeConfigBlock(JSON.stringify({ notificationEventsUrl: 'https://events.example' }));
  });

  afterEach(() => {
    clearConfigBlock();
    Reflect.deleteProperty(window, 'EventSource');
  });

  it('opens nothing unless the setting names a service', () => {
    writeConfigBlock(JSON.stringify({ flags: {} }));

    const { view } = setup();

    expect(FakeEventSource.opened).toHaveLength(0);
    expect(view.result.current).toBe(0);
  });

  it('records each event as unread and counts it once the record has settled', async () => {
    const { repository, report, view } = setup();

    act(send);
    await waitFor(() => expect(view.result.current).toBe(1));
    act(send);
    await waitFor(() => expect(view.result.current).toBe(2));

    expect(await repository.countUnread()).toBe(2);
    expect((await repository.list()).items[0]).toMatchObject({
      messageKey: 'notification_center.broadcast.new_version',
      read: false,
    });
    expect(report).not.toHaveBeenCalled();
  });

  it('reports a failed record and counts nothing', async () => {
    const repository = new InMemoryNotificationRepository({ items: [] });
    const failure = new Error('record failed');
    jest.spyOn(repository, 'record').mockRejectedValue(failure);
    const { report, view } = setup(repository);

    act(send);

    await waitFor(() =>
      expect(report).toHaveBeenCalledWith('app-shell:notifications-record', failure)
    );
    expect(view.result.current).toBe(0);
  });

  it('opens a new stream for a new reporter and closes the earlier one', async () => {
    const repository = new InMemoryNotificationRepository({ items: [] });
    const failure = new Error('record failed');
    jest.spyOn(repository, 'record').mockRejectedValue(failure);
    const [first, second] = [jest.fn(), jest.fn()];
    const wrapper = ({ children }: { children: ReactNode }): JSX.Element => (
      <RepositoryContext value={repository}>{children}</RepositoryContext>
    );
    const view = renderHook(({ report }) => useBroadcastEvents(report), {
      initialProps: { report: first },
      wrapper,
    });

    view.rerender({ report: second });
    act(send);

    await waitFor(() => expect(second).toHaveBeenCalledTimes(1));
    expect(first).not.toHaveBeenCalled();
    expect(FakeEventSource.opened.map(({ readyState }) => readyState)).toEqual([2, 1]);
  });

  it('keeps one stream across renders and closes it on unmount', () => {
    const { view } = setup();

    view.rerender(undefined);
    expect(FakeEventSource.opened).toHaveLength(1);
    view.unmount();

    expect(FakeEventSource.last().readyState).toBe(FakeEventSource.CLOSED);
  });
});
