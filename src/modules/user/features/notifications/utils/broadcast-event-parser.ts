import type { NotificationMessageKey } from '@/lib/notifications/types/notification-draft';

import type { BroadcastEvent, BroadcastEventReader } from '../types/broadcast-event';

const MESSAGE_KEYS = new Map<unknown, NotificationMessageKey>([
  ['maintenance_planned', 'notification_center.broadcast.maintenance_planned'],
  ['new_version', 'notification_center.broadcast.new_version'],
]);

export default class BroadcastEventParser implements BroadcastEventReader {
  public readonly type = 'crm.broadcast';

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
    if (type !== this.type || typeof occurredAt !== 'string') return null;
    const createdAt = this.instantOf(occurredAt);
    if (typeof id !== 'string' || id === '') return null;
    return messageKey === undefined || Number.isNaN(createdAt)
      ? null
      : { id, draft: { kind: 'success', messageKey, createdAt } };
  }

  private instantOf(occurredAt: string): number {
    const day = occurredAt.slice(0, 10);
    const exists = new Date(`${day}T00:00:00Z`).toISOString().startsWith(day);

    return exists ? Date.parse(occurredAt) : Number.NaN;
  }
}
