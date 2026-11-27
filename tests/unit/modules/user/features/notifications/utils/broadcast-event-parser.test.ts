import Parser from '@/modules/user/features/notifications/utils/broadcast-event-parser';
import { buildBroadcastEvent } from '@tests/builders/broadcast-event';
import loadIsolated from '@tests/unit/utils/isolated-module';

const parser = new Parser();

const parse = (overrides: Parameters<typeof buildBroadcastEvent>[0] = {}): unknown =>
  parser.parse(JSON.stringify(buildBroadcastEvent(overrides)));

const loadParser = async (): Promise<Parser> => {
  const IsolatedParser = await loadIsolated(
    async () =>
      (await import('@/modules/user/features/notifications/utils/broadcast-event-parser')).default
  );

  return new IsolatedParser();
};

describe('BroadcastEventParser', () => {
  afterEach(() => jest.restoreAllMocks());

  it.each([
    ['maintenance_planned', 'notification_center.broadcast.maintenance_planned'],
    ['new_version', 'notification_center.broadcast.new_version'],
  ])('turns the code %s into our own message key', async (code, messageKey) => {
    const event = buildBroadcastEvent({ data: { code } });
    const isolated = await loadParser();

    expect(isolated.parse(JSON.stringify(event))).toEqual({
      id: event.id,
      draft: { kind: 'success', messageKey, createdAt: Date.parse('2026-11-23T12:00:00Z') },
    });
  });

  it.each([
    ['2026-11-23T23:30:00Z', '2026-11-23T23:30:00Z'],
    ['2026-11-23T23:30:00.125Z', '2026-11-23T23:30:00.125Z'],
    ['2026-11-23T23:30:00-05:00', '2026-11-24T04:30:00Z'],
    ['2026-11-23T23:30:00+02:00', '2026-11-23T21:30:00Z'],
  ])('keeps the instant of %s', async (occurredAt, instant) => {
    const isolated = await loadParser();

    expect(isolated.parse(JSON.stringify(buildBroadcastEvent({ occurredAt })))).toMatchObject({
      draft: { createdAt: Date.parse(instant) },
    });
  });

  it.each([
    '2026-11-23',
    '2026-11-23 12:00',
    '2026-11-23 12:00:00Z',
    '2026-11-23 T12:00:00Z',
    '2026-11-23T12:00Z',
    '2026-11-23T12:00:00',
    '2026-11-23T12:00:00Z later',
  ])('drops the time %s in an engine that reads it', async (occurredAt) => {
    const isolated = await loadParser();
    jest.spyOn(Date, 'parse').mockReturnValue(0);

    expect(isolated.parse(JSON.stringify(buildBroadcastEvent({ occurredAt })))).toBeNull();
  });

  it('never carries text from the event', () => {
    const parsed = parse({ data: { code: 'new_version', text: 'Hello', messageKey: 'auth.x' } });

    expect(JSON.stringify(parsed)).not.toMatch(/Hello|auth\.x/);
  });

  it.each([
    ['an unknown code', { data: { code: 'password_changed' } }],
    ['a code of the prototype', { data: { code: 'constructor' } }],
    ['a code that is not text', { data: { code: 7 } }],
    ['no data', { data: null }],
    ['no id', { id: undefined as unknown as string }],
    ['an empty id', { id: '' }],
    ['an unreadable time', { occurredAt: 'yesterday' }],
    ['an unreadable hour', { occurredAt: '2026-11-23Tnoon' }],
    ['a day that does not exist', { occurredAt: '2026-02-31T12:00:00Z' }],
    ['a time in another notation', { occurredAt: 'Nov 23, 2026' }],
    ['a time that is a number', { occurredAt: 2026 as unknown as string }],
    ['a time that is a list', { occurredAt: ['2026-11-23T12:00:00Z'] as unknown as string }],
    ['a foreign type', { type: 'crm.personal' }],
    ['no type', { type: undefined as unknown as string }],
    ['no time', { occurredAt: undefined as unknown as string }],
  ])('drops an event with %s', (_name, overrides) => {
    expect(parse(overrides)).toBeNull();
  });

  it.each(['not json', 'null', '"text"', '[]'])('drops the frame %s', (text) => {
    expect(parser.parse(text)).toBeNull();
  });

  it('carries the string values the event sends for its message', () => {
    const values = { window: '02:00–04:00', product: 'CRM' };

    expect(parse({ data: { code: 'maintenance_planned', values } })).toMatchObject({
      draft: {
        messageKey: 'notification_center.broadcast.maintenance_planned',
        messageValues: {
          items: [
            { name: 'window', value: '02:00–04:00' },
            { name: 'product', value: 'CRM' },
          ],
        },
      },
    });
  });

  it('keeps an empty set of values', () => {
    expect(parse({ data: { code: 'new_version', values: {} } })).toMatchObject({
      draft: { messageValues: { items: [] } },
    });
  });

  it('adds no values when the event sends none', () => {
    const parsed = parse({ data: { code: 'new_version' } });

    expect(parsed).toMatchObject({
      draft: { messageKey: 'notification_center.broadcast.new_version' },
    });
    expect(parsed).not.toHaveProperty('draft.messageValues');
  });

  it.each([
    ['null', null],
    ['text', 'Google'],
    ['a number', 7],
    ['a list of text', ['Google']],
    ['a number among the values', { provider: 'Google', count: 2 }],
    ['an object among the values', { provider: { name: 'Google' } }],
    ['a missing value', { provider: null }],
  ])('keeps the event but drops values that are %s', (_name, values) => {
    const parsed = parse({ data: { code: 'new_version', values } });

    expect(parsed).toMatchObject({
      draft: { messageKey: 'notification_center.broadcast.new_version' },
    });
    expect(parsed).not.toHaveProperty('draft.messageValues');
  });
});
