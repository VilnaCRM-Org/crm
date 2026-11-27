import {
  buildNotificationRecord,
  buildNotificationRecordDraftSet,
  buildNotificationRecordSet,
} from '@tests/builders/notification-record';

const SEED_KEYS = [
  'notification_center.seed.saved',
  'notification_center.seed.email_sent',
  'notification_center.seed.password_changed',
];

describe('notification record builders', () => {
  it('builds an unread success record with a fixed catalog key', () => {
    expect(buildNotificationRecord()).toMatchObject({
      kind: 'success',
      messageKey: 'notification_center.seed.saved',
      read: false,
    });
  });

  it('gives every record of a set its own id', () => {
    const { items } = buildNotificationRecordSet(5, { read: true });

    expect(new Set(items.map((record) => record.id)).size).toBe(5);
    expect(items.every((record) => record.read)).toBe(true);
  });

  it('takes the keys of a set from the catalog, in order', () => {
    expect(buildNotificationRecordSet().items.map((record) => record.messageKey)).toEqual(
      SEED_KEYS
    );
    expect(buildNotificationRecordDraftSet().items.map((draft) => draft.messageKey)).toEqual(
      SEED_KEYS
    );
  });
});
