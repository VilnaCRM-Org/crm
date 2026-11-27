import ALTERNATING_MARK from '@/lib/live-region/alternating-mark';
import CLEARED_NOTIFICATION_OUTLET from '@/lib/notifications/cleared-notification-outlet';
import notificationRaiseBuilder from '@/lib/notifications/notification-raise-builder';
import type { NotificationMessageValues } from '@/lib/notifications/types/notification-draft';
import type { NotificationOutletState } from '@/lib/notifications/types/notification-outlet-state';
import { buildNotificationDraft } from '@tests/builders/notification-draft';
import loadIsolated from '@tests/unit/utils/isolated-module';

const RAISED_AT = 1_789_000_000_000;
const translate = (key: string): string => `text:${key}`;

const build = (
  drafts: ReturnType<typeof buildNotificationDraft>[],
  state: NotificationOutletState = CLEARED_NOTIFICATION_OUTLET
): NotificationOutletState =>
  notificationRaiseBuilder.build({
    state,
    drafts: { items: drafts },
    translate,
    raisedAt: RAISED_AT,
  });

describe('NotificationRaiseBuilder', () => {
  it('returns a new state and leaves the input state untouched', () => {
    const before = { ...CLEARED_NOTIFICATION_OUTLET };

    const next = build([buildNotificationDraft()]);

    expect(next).not.toBe(CLEARED_NOTIFICATION_OUTLET);
    expect(CLEARED_NOTIFICATION_OUTLET).toEqual(before);
    expect(next.focus).toBeNull();
  });

  it('stamps ids from nextId and the raise time', () => {
    const first = buildNotificationDraft();
    const second = buildNotificationDraft({ kind: 'error' });
    const state = { ...CLEARED_NOTIFICATION_OUTLET, nextId: 7 };

    const next = build([first, second], state);

    expect(next.shown.items).toEqual([
      { ...first, id: 7, raisedAt: RAISED_AT },
      { ...second, id: 8, raisedAt: RAISED_AT },
    ]);
    expect(next.raised.items).toEqual(next.shown.items);
    expect(next).toMatchObject({ nextId: 9, revision: 1 });
  });

  it('keeps the batches nobody recorded ahead of the new one, in order', () => {
    const first = build([buildNotificationDraft(), buildNotificationDraft({ kind: 'error' })]);

    const second = build([buildNotificationDraft()], first);

    expect(second.raised.items.map((item) => item.id)).toEqual([1, 2, 3]);
    expect(second.raised.items.slice(0, 2)).toEqual(first.raised.items);
  });

  it('drops the batches that were recorded', () => {
    const first = build([buildNotificationDraft()]);

    const second = build([buildNotificationDraft()], { ...first, recorded: first.revision });

    expect(second.raised.items.map((item) => item.id)).toEqual([2]);
  });

  it('suffixes the mark only on non-empty texts of a marked raise', () => {
    const success = buildNotificationDraft();

    const marked = build([success]);
    const unmarked = build([success], { ...CLEARED_NOTIFICATION_OUTLET, marked: true });

    expect(marked.announcement).toEqual({
      polite: `text:${success.messageKey}${ALTERNATING_MARK}`,
      assertive: '',
    });
    expect(unmarked.announcement).toEqual({ polite: `text:${success.messageKey}`, assertive: '' });
    expect(unmarked.marked).toBe(false);
  });

  it('separates the texts with the space the module declares when it loads', async () => {
    const isolated = await loadIsolated(
      async () => (await import('@/lib/notifications/notification-raise-builder')).default
    );

    const next = isolated.build({
      state: { ...CLEARED_NOTIFICATION_OUTLET, marked: true },
      drafts: {
        items: [
          buildNotificationDraft({ messageKey: 'first' }),
          buildNotificationDraft({ messageKey: 'second' }),
        ],
      },
      translate,
      raisedAt: RAISED_AT,
    });

    expect(next.announcement.polite).toBe('text:first text:second');
  });

  it('joins several texts of one kind with a single space', () => {
    const a = buildNotificationDraft();
    const b = buildNotificationDraft({ messageKey: 'settings.toasts.email_sent' });

    const next = build([a, b], { ...CLEARED_NOTIFICATION_OUTLET, marked: true });

    expect(next.announcement.polite).toBe(`text:${a.messageKey} text:${b.messageKey}`);
  });

  it('speaks each message with its own values, and with none when it has none', () => {
    const translateWith = jest.fn(
      (key: string, values: NotificationMessageValues | undefined): string =>
        `${key}(${(values?.items ?? []).map(({ name, value }) => `${name}=${value}`).join()})`
    );
    const linked = buildNotificationDraft({
      messageKey: 'settings.social.linked',
      messageValues: { items: [{ name: 'provider', value: 'Google' }] },
    });
    const failed = buildNotificationDraft({ kind: 'error', messageKey: 'settings.toasts.failed' });

    const next = notificationRaiseBuilder.build({
      state: { ...CLEARED_NOTIFICATION_OUTLET, marked: true },
      drafts: { items: [linked, failed] },
      translate: translateWith,
      raisedAt: RAISED_AT,
    });

    expect(next.announcement).toEqual({
      polite: 'settings.social.linked(provider=Google)',
      assertive: 'settings.toasts.failed()',
    });
    expect(translateWith.mock.calls).toEqual([
      ['settings.social.linked', { items: [{ name: 'provider', value: 'Google' }] }],
      ['settings.toasts.failed', undefined],
    ]);
    expect(next.shown.items[0]?.messageValues).toEqual({
      items: [{ name: 'provider', value: 'Google' }],
    });
  });
});
