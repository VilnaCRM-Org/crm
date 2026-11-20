import { faker } from '@faker-js/faker';

import type {
  NotificationDraft,
  NotificationDraftSet,
} from '@/lib/notifications/types/notification-draft';

const DEFAULT_DRAFT_COUNT = 3;
const MESSAGE_KEY_LENGTH = 12;

export function buildNotificationDraft(
  overrides: Partial<NotificationDraft> = {}
): NotificationDraft {
  return {
    kind: 'success',
    messageKey: faker.string.alphanumeric(MESSAGE_KEY_LENGTH),
    ...overrides,
  };
}

export function buildNotificationDraftSet(
  count: number = DEFAULT_DRAFT_COUNT,
  overrides: Partial<NotificationDraft> = {}
): NotificationDraftSet {
  return { items: Array.from({ length: count }, () => buildNotificationDraft(overrides)) };
}
