import type { ErrorReporter } from '@/services/types/error-reporting';
import type {
  CaptureContext,
  ObservabilityService,
  ObservabilityUser,
  WebVitalMetric,
} from '@/services/types/observability/observability';

import correlationIdProvider from './correlation-id-provider';
import sentryClient from './sentry-client';
import sentryConfig from './sentry-config';
import webVitalsReporter from './web-vitals-reporter';

export class ObservabilityCore implements ObservabilityService, ErrorReporter {
  private started: boolean = false;

  public init(): void {
    if (this.started || !sentryConfig.isEnabled()) return;
    this.started = true;
    this.start();
  }

  public captureError(error: unknown, context?: CaptureContext): void {
    this.safe(() => sentryClient.captureException(error, this.withCorrelation(context)));
  }

  public report(error: Error, context?: Record<string, unknown>): void {
    this.captureError(error, context);
  }

  public setUser(identity: ObservabilityUser): void {
    this.safe(() => sentryClient.setUser({ ...identity }));
  }

  public clearUser(): void {
    this.safe(() => sentryClient.clearUser());
  }

  public reportVital(metric: WebVitalMetric): void {
    this.safe(() =>
      sentryClient.addBreadcrumb({
        category: 'web-vitals',
        message: metric.name,
        data: { value: metric.value, id: metric.id },
      })
    );
  }

  private start(): void {
    const swallow = (): void => {};
    void sentryClient.init().catch(swallow);
    void webVitalsReporter
      .subscribe((metric: WebVitalMetric) => this.reportVital(metric))
      .catch(swallow);
  }

  private withCorrelation(context?: CaptureContext): CaptureContext | undefined {
    const id = correlationIdProvider.currentId;
    if (!id) return context;
    return { ...context, [correlationIdProvider.header]: id };
  }

  private safe(action: () => void): void {
    try {
      action();
    } catch (caught) {
      void caught;
    }
  }
}

const observabilityCore = new ObservabilityCore();

export default observabilityCore;
