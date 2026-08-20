import type { AuthFailureWindow } from '@/services/types/security-events/security-event';

import securityEventConfig from './security-event-config';

const MAX_TRACKED_FAILURES = 1000;

export class AuthFailureMonitor {
  private readonly failures: number[] = [];

  public observe(now: number = Date.now()): AuthFailureWindow {
    const windowMs = securityEventConfig.windowMs();
    const threshold = securityEventConfig.threshold();
    this.failures.push(now);
    this.prune(now - windowMs);
    const failureCount = this.failures.length;
    return { failureCount, windowMs, threshold, thresholdBreached: failureCount >= threshold };
  }

  private prune(oldest: number): void {
    while (this.isStale(oldest)) this.failures.shift();
  }

  private isStale(oldest: number): boolean {
    if (this.failures.length > MAX_TRACKED_FAILURES) return true;
    return this.failures.length > 0 && (this.failures[0] as number) < oldest;
  }
}

const authFailureMonitor = new AuthFailureMonitor();

export default authFailureMonitor;
