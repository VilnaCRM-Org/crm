import type { NotificationMessageKey } from '@/lib/notifications/types/notification-draft';

import type { BroadcastEvent, BroadcastEventReader } from '../types/broadcast-event';

const MESSAGE_KEYS = new Map<unknown, NotificationMessageKey>([
  ['maintenance_planned', 'notification_center.broadcast.maintenance_planned'],
  ['new_version', 'notification_center.broadcast.new_version'],
]);

const EVENT_TYPE = 'crm.broadcast';

export default class BroadcastEventParser implements BroadcastEventReader {
  public parse(text: string): BroadcastEvent | null {
    try {
      return this.eventOf(JSON.parse(text));
    } catch {
      return null;
    }
  }

  private eventOf(value: unknown): BroadcastEvent | null {
    const { id, type, occurredAt, data } = Object(value) as Record<string, unknown>;
    const messageKey = MESSAGE_KEYS.get(Object(data).code);
    if (type !== EVENT_TYPE || typeof occurredAt !== 'string') return null;
    const createdAt = Date.parse(occurredAt);
    if (typeof id !== 'string' || id === '') return null;
    return messageKey === undefined || Number.isNaN(createdAt)
      ? null
      : { id, draft: { kind: 'success', messageKey, createdAt } };
  }
}
