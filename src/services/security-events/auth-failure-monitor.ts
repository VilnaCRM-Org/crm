import type { AuthFailureWindow } from '@/services/types/security-events/security-event';

import securityEventConfig from './security-event-config';

export class AuthFailureMonitor {
  private failures: number[] = [];

  private breached = false;

  public observe(now: number = Date.now()): AuthFailureWindow {
    const windowMs = securityEventConfig.windowMs();
    const threshold = securityEventConfig.threshold();
    this.failures = [...this.failures, now]
      .filter((at) => at >= now - windowMs)
      .slice(-securityEventConfig.maxTrackedFailures());
    const failureCount = this.failures.length;
    const breached = failureCount >= threshold;
    const thresholdCrossed = breached && !this.breached;
    this.breached = breached;
    return { failureCount, windowMs, threshold, thresholdCrossed };
  }
}

const authFailureMonitor = new AuthFailureMonitor();

export default authFailureMonitor;
