import { act, renderHook, waitFor } from '@testing-library/react';

import useBroadcastEvents from '@/modules/user/features/notifications/hooks/use-broadcast-events';
import { inMemoryNotificationRepository } from '@/modules/user/features/notifications/repositories';
import Client from '@/modules/user/features/notifications/utils/broadcast-event-client';
import Parser from '@/modules/user/features/notifications/utils/broadcast-event-parser';
import { buildBroadcastEvent } from '@tests/builders/broadcast-event';
import FakeEventSource from '@tests/unit/utils/fake-event-source';
import { clearConfigBlock, writeConfigBlock } from '@tests/utils/config-block';

const frame = (overrides: Parameters<typeof buildBroadcastEvent>[0] = {}): string =>
  JSON.stringify(buildBroadcastEvent(overrides));

describe('broadcast events into the notification history', () => {
  beforeEach(() => {
    FakeEventSource.opened = [];
    Object.defineProperty(window, 'EventSource', { configurable: true, value: FakeEventSource });
  });

  afterEach(() => {
    clearConfigBlock();
    jest.restoreAllMocks();
    jest.useRealTimers();
    Reflect.deleteProperty(window, 'EventSource');
  });

  it('opens no stream without the setting', () => {
    renderHook(() => useBroadcastEvents(jest.fn()));

    expect(FakeEventSource.opened).toHaveLength(0);
  });

  it('adds a broadcast to the history as unread and reports a write that fails', async () => {
    writeConfigBlock(JSON.stringify({ notificationEventsUrl: 'https://events.example' }));
    const report = jest.fn();
    const before = await inMemoryNotificationRepository.countUnread();
    const { result, unmount } = renderHook(() => useBroadcastEvents(report));

    act(() => FakeEventSource.last().send(frame()));
    await waitFor(() => expect(result.current).toBe(1));
    expect(await inMemoryNotificationRepository.countUnread()).toBe(before + 1);

    const failure = new Error('record failed');
    jest.spyOn(inMemoryNotificationRepository, 'record').mockRejectedValue(failure);
    act(() => FakeEventSource.last().send(frame()));
    await waitFor(() =>
      expect(report).toHaveBeenCalledWith('app-shell:notifications-record', failure)
    );
    unmount();
    expect(FakeEventSource.last().readyState).toBe(FakeEventSource.CLOSED);
  });

  it('drops unknown, repeated and unreadable events and resumes a closed stream', () => {
    jest.useFakeTimers();
    jest.spyOn(Math, 'random').mockReturnValue(0);
    const receive = jest.fn();
    const base = 'https://events.example';
    const stop = new Client({ base, parser: new Parser(), receive }).open();
    const source = FakeEventSource.last();
    source.onopen?.();

    const repeated = frame();
    const foreign = JSON.stringify({ ...buildBroadcastEvent(), type: 'other' });
    const noSuchDay = frame({ occurredAt: '2026-02-31T12:00:00Z' });
    [
      repeated,
      repeated,
      'garbage',
      foreign,
      frame({ id: '' }),
      frame({ data: null }),
      noSuchDay,
    ].forEach((text, index) => source.send(text, String(index)));
    source.send(foreign, '');
    Array.from({ length: 500 }, () => frame()).forEach((text) => source.send(text, '900'));
    expect(receive).toHaveBeenCalledTimes(501);

    source.fail(0);
    source.fail(FakeEventSource.CLOSED);
    jest.advanceTimersByTime(500);
    expect(FakeEventSource.last().url).toContain('lastEventId=900');
    stop();
  });
});
