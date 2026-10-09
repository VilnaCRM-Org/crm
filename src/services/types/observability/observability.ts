import type {
  SecurityEventCategory,
  SecurityEventName,
  SecurityEventSeverity,
} from '@/services/types/security-events/security-event';

export type RequestIdHeader = 'X-Request-Id';

export type CorrelationIdHeader = 'X-Correlation-Id';

export interface ObservabilityUser {
  id: string;
  tenantId?: string;
  sessionId?: string;
}

export interface WebVitalMetric {
  name: string;
  value: number;
  id: string;
}

export interface CaptureContext {
  surface?: string | undefined;
  stage?: string | undefined;
  source?: string | undefined;
  pattern?: string | undefined;
  componentStack?: string | null | undefined;
  'X-Request-Id'?: string | undefined;
  'X-Correlation-Id'?: string | undefined;
  event?: SecurityEventName | undefined;
  category?: SecurityEventCategory | undefined;
  reason?: string | undefined;
  severity?: SecurityEventSeverity | undefined;
  failureCount?: number | undefined;
  windowMs?: number | undefined;
  threshold?: number | undefined;
  thresholdCrossed?: boolean | undefined;
}

export interface ObservabilityService {
  init(): void;
  captureError(error: unknown, context?: CaptureContext): void;
  setUser(identity: ObservabilityUser): void;
  clearUser(): void;
  reportVital(metric: WebVitalMetric): void;
}
