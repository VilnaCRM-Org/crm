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

export type CaptureContext = Record<string, unknown>;

export interface ObservabilityService {
  init(): void;
  captureError(error: unknown, context?: CaptureContext): void;
  setUser(identity: ObservabilityUser): void;
  clearUser(): void;
  reportVital(metric: WebVitalMetric): void;
}
