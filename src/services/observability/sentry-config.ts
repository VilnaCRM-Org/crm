import rawEnv from '@/config/env/raw-env';
import type { SentryBeforeSend, SentryInitOptions } from '@/services/types/observability/sentry';

export class SentryConfig {
  public dsn(): string {
    return rawEnv.sentryDsn() ?? '';
  }

  public isEnabled(): boolean {
    return this.dsn().length > 0;
  }

  public environment(): string {
    return rawEnv.sentryEnvironment() ?? rawEnv.nodeEnv() ?? 'development';
  }

  public release(): string | undefined {
    return rawEnv.release();
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
