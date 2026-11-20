import { faker } from '@faker-js/faker';

import type {
  NotificationRecord,
  NotificationRecordDraft,
  NotificationRecordDraftSet,
  NotificationRecordSet,
} from '@/modules/user/features/notifications/types/notification-record';

const DEFAULT_RECORD_COUNT = 3;
const MESSAGE_KEY_LENGTH = 12;

export function buildNotificationRecord(
  overrides: Partial<NotificationRecord> = {}
): NotificationRecord {
  return {
    id: faker.string.uuid(),
    kind: 'success',
    messageKey: faker.string.alphanumeric(MESSAGE_KEY_LENGTH),
    createdAt: faker.date.past().getTime(),
    read: false,
    ...overrides,
  };
}

export function buildNotificationRecordSet(
  count: number = DEFAULT_RECORD_COUNT,
  overrides: Partial<NotificationRecord> = {}
): NotificationRecordSet {
  return { items: Array.from({ length: count }, () => buildNotificationRecord(overrides)) };
}

export function buildNotificationRecordDraft(
  overrides: Partial<NotificationRecordDraft> = {}
): NotificationRecordDraft {
  return {
    kind: 'success',
    messageKey: faker.string.alphanumeric(MESSAGE_KEY_LENGTH),
    createdAt: faker.date.past().getTime(),
    ...overrides,
  };
}

export function buildNotificationRecordDraftSet(
  count: number = DEFAULT_RECORD_COUNT,
  overrides: Partial<NotificationRecordDraft> = {}
): NotificationRecordDraftSet {
  return {
    items: Array.from({ length: count }, () => buildNotificationRecordDraft(overrides)),
  };
}
