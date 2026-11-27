import type { NotificationMessageKey } from '@/lib/notifications/types/notification-draft';

import type { BroadcastEvent, BroadcastEventReader } from '../types/broadcast-event';
import type { NotificationRecordDraft } from '../types/notification-record';

const MESSAGE_KEYS = new Map<unknown, NotificationMessageKey>([
  ['maintenance_planned', 'notification_center.broadcast.maintenance_planned'],
  ['new_version', 'notification_center.broadcast.new_version'],
]);

const TIME_OF_DAY = /^T\d{2}:\d{2}:(?:\d{2}|\d{2}\.\d+)(?:Z|[+-]\d{2}:\d{2})$/u;

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
    const body = Object(data);
    const messageKey = MESSAGE_KEYS.get(body.code);
    const time = String(occurredAt);
    if (type !== this.type || time !== occurredAt) return null;
    const createdAt = this.instantOf(time);
    if (typeof id !== 'string' || id === '') return null;
    return messageKey === undefined || Number.isNaN(createdAt)
      ? null
      : { id, draft: { kind: 'success', messageKey, createdAt, ...this.valuesOf(body.values) } };
  }

  private valuesOf(values: unknown): Pick<NotificationRecordDraft, 'messageValues'> {
    if (values === null || typeof values !== 'object' || Array.isArray(values)) return {};
    const entries = Object.entries(values);

    return entries.every((entry): entry is [string, string] => typeof entry[1] === 'string')
      ? { messageValues: { items: entries.map(([name, value]) => ({ name, value })) } }
      : {};
  }

  private instantOf(occurredAt: string): number {
    const day = occurredAt.slice(0, 10);
    const exists = new Date(`${day}T00:00:00Z`).toISOString().startsWith(day);

    return exists && TIME_OF_DAY.test(occurredAt.slice(10)) ? Date.parse(occurredAt) : Number.NaN;
  }
}
