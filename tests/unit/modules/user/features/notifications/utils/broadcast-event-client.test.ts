import Client from '@/modules/user/features/notifications/utils/broadcast-event-client';
import Parser from '@/modules/user/features/notifications/utils/broadcast-event-parser';
import { buildBroadcastEvent } from '@tests/builders/broadcast-event';
import FakeEventSource from '@tests/unit/utils/fake-event-source';

const open = (
  receive = jest.fn()
): { receive: jest.Mock; stop: () => void; source: () => FakeEventSource } => {
  const client = new Client({
    base: 'https://events.example',
    parser: new Parser(),
    receive,
  });
  return { receive, stop: client.open(), source: () => FakeEventSource.last() };
};

const frame = (overrides: Parameters<typeof buildBroadcastEvent>[0] = {}): string =>
  JSON.stringify(buildBroadcastEvent(overrides));

describe('BroadcastEventClient', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.spyOn(Math, 'random').mockReturnValue(0);
    FakeEventSource.opened = [];
    Object.defineProperty(window, 'EventSource', { configurable: true, value: FakeEventSource });
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
    Reflect.deleteProperty(window, 'EventSource');
  });

  it('opens one stream of the broadcast type, without a cursor', () => {
    open();

    expect(FakeEventSource.opened.map(({ url }) => url)).toEqual([
      'https://events.example/api/events/stream?types=crm.broadcast',
    ]);
  });

  it('hands over a valid event and ignores an invalid one', () => {
    const { receive, source } = open();

    source().send(frame({ data: { code: 'maintenance_planned' } }));
    source().send('garbage');

    expect(receive).toHaveBeenCalledTimes(1);
    expect(receive).toHaveBeenCalledWith({
      kind: 'success',
      messageKey: 'notification_center.broadcast.maintenance_planned',
      createdAt: Date.parse('2026-11-23T12:00:00Z'),
    });
  });

  it('hands over an event delivered twice only once', () => {
    const { receive, source } = open();
    const repeated = frame();

    source().send(repeated, '4');
    source().send(repeated, '5');
    source().send(frame(), '6');

    expect(receive).toHaveBeenCalledTimes(2);
  });

  it('remembers the newest 500 ids and forgets the oldest beyond them', () => {
    const { receive, source } = open();
    const first = frame({ id: 'first' });
    source().send(first);
    for (let index = 0; index < 499; index += 1) source().send(frame({ id: `id-${index}` }));
    source().send(first);
    expect(receive).toHaveBeenCalledTimes(500);

    source().send(frame({ id: 'one-more' }));
    source().send(first);

    expect(receive).toHaveBeenCalledTimes(502);
  });

  it('leaves reconnecting to the browser while the stream is not closed', () => {
    const { source } = open();

    source().fail(0);
    jest.advanceTimersByTime(60_000);

    expect(FakeEventSource.opened).toHaveLength(1);
  });

  it('opens a closed stream again after the last id it saw, invalid frames included', () => {
    const { source } = open();
    source().send(frame(), '41');
    source().send('garbage', '42');

    source().fail(FakeEventSource.CLOSED);
    jest.advanceTimersByTime(499);
    expect(FakeEventSource.opened).toHaveLength(1);
    jest.advanceTimersByTime(1);

    expect(source().url).toBe(
      'https://events.example/api/events/stream?types=crm.broadcast&lastEventId=42'
    );
  });

  it('doubles the delay of each failed attempt up to 30 s and starts over once open', () => {
    const { source } = open();
    const delays = [500, 1_000, 2_000, 4_000, 8_000, 15_000, 15_000];
    delays.forEach((delay, index) => {
      source().fail(FakeEventSource.CLOSED);
      jest.advanceTimersByTime(delay - 1);
      expect(FakeEventSource.opened).toHaveLength(index + 1);
      jest.advanceTimersByTime(1);
      expect(FakeEventSource.opened).toHaveLength(index + 2);
    });

    source().onopen?.();
    source().fail(FakeEventSource.CLOSED);
    jest.advanceTimersByTime(500);

    expect(FakeEventSource.opened).toHaveLength(delays.length + 2);
  });

  it('spreads the delay over the upper half of the window', () => {
    jest.mocked(Math.random).mockReturnValue(0.5);
    const { source } = open();

    source().fail(FakeEventSource.CLOSED);
    jest.advanceTimersByTime(749);
    expect(FakeEventSource.opened).toHaveLength(1);
    jest.advanceTimersByTime(1);

    expect(FakeEventSource.opened).toHaveLength(2);
  });

  it('closes the stream and drops a waiting attempt when stopped', () => {
    const { stop, source } = open();
    const first = source();
    first.fail(FakeEventSource.CLOSED);

    stop();
    jest.advanceTimersByTime(60_000);

    expect(FakeEventSource.opened).toHaveLength(1);
  });

  it('closes an open stream when stopped', () => {
    const { stop, source } = open();

    stop();

    expect(source().readyState).toBe(FakeEventSource.CLOSED);
  });
});
