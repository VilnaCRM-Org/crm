import { faker } from '@faker-js/faker';

import type {
  NotificationRecord,
  NotificationRecordDraft,
  NotificationRecordDraftSet,
  NotificationRecordSet,
} from '@/modules/user/features/notifications/types/notification-record';

const DEFAULT_RECORD_COUNT = 3;

const MESSAGE_KEYS = [
  'notification_center.seed.saved',
  'notification_center.seed.email_sent',
  'notification_center.seed.password_changed',
] as const;

const messageKeyAt = (index: number): string =>
  MESSAGE_KEYS[index % MESSAGE_KEYS.length] ?? MESSAGE_KEYS[0];

export function buildNotificationRecord(
  overrides: Partial<NotificationRecord> = {}
): NotificationRecord {
  return {
    id: faker.string.uuid(),
    kind: 'success',
    messageKey: MESSAGE_KEYS[0],
    createdAt: faker.date.past().getTime(),
    read: false,
    ...overrides,
  };
}

export function buildNotificationRecordSet(
  count: number = DEFAULT_RECORD_COUNT,
  overrides: Partial<Omit<NotificationRecord, 'id'>> = {}
): NotificationRecordSet {
  return {
    items: Array.from({ length: count }, (_unused, index) =>
      buildNotificationRecord({ messageKey: messageKeyAt(index), ...overrides })
    ),
  };
}

export function buildNotificationRecordDraft(
  overrides: Partial<NotificationRecordDraft> = {}
): NotificationRecordDraft {
  return {
    kind: 'success',
    messageKey: MESSAGE_KEYS[0],
    createdAt: faker.date.past().getTime(),
    ...overrides,
  };
}

export function buildNotificationRecordDraftSet(
  count: number = DEFAULT_RECORD_COUNT,
  overrides: Partial<NotificationRecordDraft> = {}
): NotificationRecordDraftSet {
  return {
    items: Array.from({ length: count }, (_unused, index) =>
      buildNotificationRecordDraft({ messageKey: messageKeyAt(index), ...overrides })
    ),
  };
}
