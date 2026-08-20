import type { SecurityEventName } from '@/services/types/security-events/security-event';

export default class SecurityEventSignal extends Error {
  public readonly event: SecurityEventName;

  constructor(event: SecurityEventName) {
    super(`security.${event}`);
    this.name = 'SecurityEventSignal';
    this.event = event;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}
