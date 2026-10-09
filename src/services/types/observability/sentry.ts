import type { Breadcrumb, Event, User } from '@sentry/react';

import type { CaptureContext, WebVitalMetric } from './observability';

export type SentryUser = User;

export type SentryBreadcrumb = Breadcrumb;

export type SentryEvent = Event;

export type SentryBeforeSend = (event: SentryEvent) => SentryEvent | null;

export interface SentryInitOptions {
  dsn: string;
  environment?: string;
  release?: string | undefined;
  tracesSampleRate?: number;
  sendDefaultPii?: boolean;
  beforeSend?: SentryBeforeSend;
}

export interface SentryCaptureHint {
  extra?: CaptureContext;
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
