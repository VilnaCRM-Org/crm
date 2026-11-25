import Parser from '@/modules/user/features/notifications/utils/broadcast-event-parser';
import { buildBroadcastEvent } from '@tests/builders/broadcast-event';

const parser = new Parser();

const parse = (overrides: Parameters<typeof buildBroadcastEvent>[0] = {}): unknown =>
  parser.parse(JSON.stringify(buildBroadcastEvent(overrides)));

describe('BroadcastEventParser', () => {
  it.each([
    ['maintenance_planned', 'notification_center.broadcast.maintenance_planned'],
    ['new_version', 'notification_center.broadcast.new_version'],
  ])('turns the code %s into our own message key', (code, messageKey) => {
    const event = buildBroadcastEvent({ data: { code } });

    expect(parser.parse(JSON.stringify(event))).toEqual({
      id: event.id,
      draft: { kind: 'success', messageKey, createdAt: Date.parse('2026-11-23T12:00:00Z') },
    });
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
    ['a time that is a number', { occurredAt: 2026 as unknown as string }],
    ['a time that is a list', { occurredAt: ['2026-11-23'] as unknown as string }],
    ['a foreign type', { type: 'crm.personal' }],
    ['no type', { type: undefined as unknown as string }],
    ['no time', { occurredAt: undefined as unknown as string }],
  ])('drops an event with %s', (_name, overrides) => {
    expect(parse(overrides)).toBeNull();
  });

  it.each(['not json', 'null', '"text"', '[]'])('drops the frame %s', (text) => {
    expect(parser.parse(text)).toBeNull();
  });
});
