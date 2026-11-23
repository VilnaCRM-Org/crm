import ALTERNATING_MARK from '@/lib/live-region/alternating-mark';
import CLEARED_NOTIFICATION_OUTLET from '@/lib/notifications/cleared-notification-outlet';
import notificationRaiseBuilder from '@/lib/notifications/notification-raise-builder';
import type { NotificationOutletState } from '@/lib/notifications/types/notification-outlet-state';
import { buildNotificationDraft } from '@tests/builders/notification-draft';

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

  it('joins several texts of one kind with a single space', () => {
    const a = buildNotificationDraft();
    const b = buildNotificationDraft({ messageKey: 'settings.toasts.email_sent' });

    const next = build([a, b], { ...CLEARED_NOTIFICATION_OUTLET, marked: true });

    expect(next.announcement.polite).toBe(`text:${a.messageKey} text:${b.messageKey}`);
  });
});
