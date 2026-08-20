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
import sessionCorrelation from './session-correlation';
import webVitalsReporter from './web-vitals-reporter';

export class ObservabilityCore implements ObservabilityService, ErrorReporter {
  private started: boolean = false;

  private vitalsSubscribed: boolean = false;

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
    const reset = (clearVitals: boolean): void => {
      this.started = false;
      if (clearVitals) this.vitalsSubscribed = false;
    };
    void sentryClient.init().catch(reset.bind(null, false));
    if (this.vitalsSubscribed) return;
    this.vitalsSubscribed = true;
    void webVitalsReporter
      .subscribe((metric: WebVitalMetric) => this.reportVital(metric))
      .catch(reset.bind(null, true));
  }

  private withCorrelation(context?: CaptureContext): CaptureContext {
    const header = correlationIdProvider.header;
    const requestId = context?.[header] ?? correlationIdProvider.currentId;
    const enriched: CaptureContext = {
      ...context,
      [sessionCorrelation.header]: sessionCorrelation.id(),
    };
    if (requestId) enriched[header] = requestId;
    return enriched;
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
