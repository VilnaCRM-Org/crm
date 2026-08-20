export type SecurityEventName =
  'auth_failure' | 'auth_failure_burst' | 'unauthorized_response' | 'error_boundary_catch';

export type SecurityEventCategory = 'login' | 'registration' | 'transport' | 'render';

export type AuthFailureCategory = Extract<SecurityEventCategory, 'login' | 'registration'>;

export type SecurityEventSeverity = 'warning' | 'critical';

export type AuthFailureReason =
  'authentication' | 'validation' | 'conflict' | 'server' | 'network' | 'rate_limited' | 'unknown';

export interface AuthFailureWindow {
  readonly failureCount: number;
  readonly windowMs: number;
  readonly threshold: number;
  readonly thresholdBreached: boolean;
}

export interface SecurityEvent {
  readonly event: SecurityEventName;
  readonly category: SecurityEventCategory;
  readonly reason: string;
  readonly severity: SecurityEventSeverity;
}

export type SecurityEventPayload = SecurityEvent & Partial<AuthFailureWindow>;

export interface SecurityEventRecorder {
  authFailure(category: AuthFailureCategory, reason: AuthFailureReason): void;
  unauthorizedResponse(status: number): void;
  boundaryCatch(surface: string): void;
}
