import observabilityCore from '@/services/observability/observability-core';
import type {
  AuthFailureCategory,
  AuthFailureReason,
  SecurityEventPayload,
  SecurityEventRecorder,
} from '@/services/types/security-events/security-event';

import authFailureMonitor from './auth-failure-monitor';
import SecurityEventSignal from './security-event-signal';

export class SecurityEventCore implements SecurityEventRecorder {
  public authFailure(category: AuthFailureCategory, reason: AuthFailureReason): void {
    const observed = authFailureMonitor.observe();
    this.emit({
      event: observed.thresholdBreached ? 'auth_failure_burst' : 'auth_failure',
      category,
      reason,
      severity: observed.thresholdBreached ? 'critical' : 'warning',
      ...observed,
    });
  }

  public unauthorizedResponse(status: number): void {
    this.emit({
      event: 'unauthorized_response',
      category: 'transport',
      reason: `http_${status}`,
      severity: 'warning',
    });
  }

  public boundaryCatch(surface: string): void {
    this.emit({
      event: 'error_boundary_catch',
      category: 'render',
      reason: surface,
      severity: 'warning',
    });
  }

  private emit(payload: SecurityEventPayload): void {
    observabilityCore.report(new SecurityEventSignal(payload.event), { ...payload });
  }
}

const securityEventCore = new SecurityEventCore();

export default securityEventCore;
