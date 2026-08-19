import type {
  SentryApi,
  SentryBreadcrumb,
  SentryCaptureHint,
  SentryEvent,
  SentryInitOptions,
  SentryUser,
} from '@/services/types/observability/sentry';

import piiScrubber from './pii-scrubber';
import sentryConfig from './sentry-config';

export class SentryClient {
  private readonly maxPending: number = 100;

  private sdk?: SentryApi;

  private loading: boolean = false;

  private readonly pending: Array<{ error: unknown; context?: Record<string, unknown> }> = [];

  private pendingUser?: { value: SentryUser | null };

  public async init(): Promise<void> {
    if (this.sdk || this.loading) return;
    const options = sentryConfig.buildOptions((event: SentryEvent) => piiScrubber.scrub(event));
    if (!options) return;
    this.loading = true;
    await this.startSdk(options);
  }

  public captureException(error: unknown, context?: Record<string, unknown>): void {
    if (this.sdk) {
      const hint: SentryCaptureHint | undefined = context ? { extra: context } : undefined;
      this.sdk.captureException(error, hint);
      return;
    }
    if (sentryConfig.isEnabled()) this.buffer(error, context);
  }

  public setUser(user: SentryUser): void {
    if (this.sdk) {
      this.sdk.setUser(user);
      return;
    }
    if (sentryConfig.isEnabled()) this.pendingUser = { value: user };
  }

  public clearUser(): void {
    if (this.sdk) {
      this.sdk.setUser(null);
      return;
    }
    if (sentryConfig.isEnabled()) this.pendingUser = { value: null };
  }

  public addBreadcrumb(breadcrumb: SentryBreadcrumb): void {
    this.sdk?.addBreadcrumb(breadcrumb);
  }

  private async startSdk(options: SentryInitOptions): Promise<void> {
    try {
      const sdk = await this.load();
      sdk.init(options);
      this.flush(sdk);
    } catch (error) {
      this.sdk = undefined;
      throw error;
    } finally {
      this.loading = false;
    }
  }

  private buffer(error: unknown, context?: Record<string, unknown>): void {
    if (this.pending.length >= this.maxPending) return;
    this.pending.push({ error, context });
  }

  private flush(sdk: SentryApi): void {
    if (this.pendingUser) {
      sdk.setUser(this.pendingUser.value);
      this.pendingUser = undefined;
    }
    const buffered = this.pending.splice(0);
    for (const item of buffered) this.captureException(item.error, item.context);
  }

  private async load(): Promise<SentryApi> {
    if (this.sdk) return this.sdk;
    const { init, captureException, setUser, setTag, addBreadcrumb } =
      await import('@sentry/react');
    this.sdk = { init, captureException, setUser, setTag, addBreadcrumb } as unknown as SentryApi;
    return this.sdk;
  }
}

const sentryClient = new SentryClient();

export default sentryClient;
