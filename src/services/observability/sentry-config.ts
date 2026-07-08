import type { SentryBeforeSend, SentryInitOptions } from '@/services/types/observability/sentry';

export class SentryConfig {
  public dsn(): string {
    return (process.env.REACT_APP_SENTRY_DSN ?? '').trim();
  }

  public isEnabled(): boolean {
    return this.dsn().length > 0;
  }

  public environment(): string {
    const explicit = (process.env.REACT_APP_SENTRY_ENVIRONMENT ?? '').trim();
    if (explicit.length > 0) return explicit;
    return (process.env.NODE_ENV ?? '').trim() || 'development';
  }

  public release(): string | undefined {
    const release = (process.env.REACT_APP_RELEASE ?? '').trim();
    return release.length > 0 ? release : undefined;
  }

  public buildOptions(beforeSend: SentryBeforeSend): SentryInitOptions | undefined {
    if (!this.isEnabled()) return undefined;
    return {
      dsn: this.dsn(),
      environment: this.environment(),
      release: this.release(),
      tracesSampleRate: 0,
      sendDefaultPii: false,
      beforeSend,
    };
  }
}

const sentryConfig = new SentryConfig();

export default sentryConfig;
