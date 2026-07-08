import type { WebVitalMetric } from './observability';

export interface SentryUser {
  [key: string]: unknown;
  id: string;
}

export interface SentryBreadcrumb {
  category?: string;
  message?: string;
  level?: string;
  data?: Record<string, unknown>;
}

export interface SentryEvent {
  [key: string]: unknown;
  request?: Record<string, unknown>;
  extra?: Record<string, unknown>;
  contexts?: Record<string, unknown>;
  user?: Record<string, unknown>;
}

export type SentryBeforeSend = (event: SentryEvent) => SentryEvent | null;

export interface SentryInitOptions {
  dsn: string;
  environment?: string;
  release?: string;
  tracesSampleRate?: number;
  sendDefaultPii?: boolean;
  beforeSend?: SentryBeforeSend;
}

export interface SentryCaptureHint {
  extra?: Record<string, unknown>;
}

export interface SentryApi {
  init(options: SentryInitOptions): void;
  captureException(error: unknown, hint?: SentryCaptureHint): string;
  setUser(user: SentryUser | null): void;
  setTag(key: string, value: string): void;
  addBreadcrumb(breadcrumb: SentryBreadcrumb): void;
}

export type WebVitalHandler = (metric: WebVitalMetric) => void;

export interface WebVitalsModule {
  onLCP: (handler: WebVitalHandler) => void;
  onINP: (handler: WebVitalHandler) => void;
  onCLS: (handler: WebVitalHandler) => void;
  onFCP: (handler: WebVitalHandler) => void;
  onTTFB: (handler: WebVitalHandler) => void;
}
