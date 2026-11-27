import type {
  NotificationDraft,
  NotificationDraftSet,
} from '@/lib/notifications/types/notification-draft';

const DEFAULT_DRAFT_COUNT = 3;

const MESSAGE_KEYS = [
  'settings.toasts.saved',
  'settings.toasts.email_sent',
  'settings.toasts.password_changed',
  'settings.toasts.resent',
] as const;

export function buildNotificationDraft(
  overrides: Partial<NotificationDraft> = {}
): NotificationDraft {
  return { kind: 'success', messageKey: MESSAGE_KEYS[0], ...overrides };
}

export function buildNotificationDraftSet(
  count: number = DEFAULT_DRAFT_COUNT,
  overrides: Partial<NotificationDraft> = {}
): NotificationDraftSet {
  return {
    items: Array.from({ length: count }, (_unused, index) =>
      buildNotificationDraft({
        messageKey: MESSAGE_KEYS[index % MESSAGE_KEYS.length] ?? MESSAGE_KEYS[0],
        ...overrides,
      })
    ),
  };
}
