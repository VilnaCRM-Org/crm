import type {
  SentryApi,
  SentryBreadcrumb,
  SentryCaptureHint,
  SentryEvent,
  SentryUser,
} from '@/services/types/observability/sentry';

import piiScrubber from './pii-scrubber';
import sentryConfig from './sentry-config';

export class SentryClient {
  private sdk?: SentryApi;

  private initialized: boolean = false;

  private readonly pending: Array<{ error: unknown; context?: Record<string, unknown> }> = [];

  public async init(): Promise<void> {
    if (this.initialized) return;
    const options = sentryConfig.buildOptions((event: SentryEvent) => piiScrubber.scrub(event));
    if (!options) return;
    const sdk = await this.load();
    sdk.init(options);
    this.initialized = true;
    this.flush();
  }

  public captureException(error: unknown, context?: Record<string, unknown>): void {
    if (this.sdk) {
      const hint: SentryCaptureHint | undefined = context ? { extra: context } : undefined;
      this.sdk.captureException(error, hint);
      return;
    }
    if (sentryConfig.isEnabled()) {
      this.pending.push({ error, context });
    }
  }

  public setUser(user: SentryUser): void {
    this.sdk?.setUser(user);
  }

  public clearUser(): void {
    this.sdk?.setUser(null);
  }

  public addBreadcrumb(breadcrumb: SentryBreadcrumb): void {
    this.sdk?.addBreadcrumb(breadcrumb);
  }

  private flush(): void {
    const buffered = this.pending.splice(0);
    for (const item of buffered) {
      this.captureException(item.error, item.context);
    }
  }

  private async load(): Promise<SentryApi> {
    if (this.sdk) return this.sdk;
    const module = await import('@sentry/react');
    this.sdk = module as unknown as SentryApi;
    return this.sdk;
  }
}

const sentryClient = new SentryClient();

export default sentryClient;
