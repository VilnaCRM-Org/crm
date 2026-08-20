import type { AuthFailureAlertEnv } from './types/env';

class RawEnv {
  public mockoonUrl(): string {
    return this.trimmed(process.env.REACT_APP_MOCKOON_URL) ?? '';
  }

  public lhciPreloadedAuthToken(): string | undefined {
    return this.trimmed(process.env.REACT_APP_LHCI_PRELOADED_AUTH_TOKEN);
  }

  public nodeEnv(): string | undefined {
    return this.trimmed(process.env.NODE_ENV);
  }

  public release(): string | undefined {
    return this.trimmed(process.env.REACT_APP_RELEASE);
  }

  public sentryDsn(): string | undefined {
    return this.trimmed(process.env.REACT_APP_SENTRY_DSN);
  }

  public sentryEnvironment(): string | undefined {
    return this.trimmed(process.env.REACT_APP_SENTRY_ENVIRONMENT);
  }

  public authFailureAlert(): AuthFailureAlertEnv {
    return {
      threshold: this.trimmed(process.env.REACT_APP_AUTH_FAILURE_ALERT_THRESHOLD),
      windowMs: this.trimmed(process.env.REACT_APP_AUTH_FAILURE_ALERT_WINDOW_MS),
    };
  }

  public snapshot(): Record<string, string | undefined> {
    const authFailureAlert = this.authFailureAlert();
    return {
      nodeEnv: process.env.NODE_ENV,
      graphqlUrl: this.trimmed(process.env.REACT_APP_GRAPHQL_URL),
      mockoonUrl: this.trimmed(process.env.REACT_APP_MOCKOON_URL),
      lhciPreloadedAuthToken: this.trimmed(process.env.REACT_APP_LHCI_PRELOADED_AUTH_TOKEN),
      mainLanguage: this.trimmed(process.env.REACT_APP_MAIN_LANGUAGE),
      fallbackLanguage: this.trimmed(process.env.REACT_APP_FALLBACK_LANGUAGE),
      release: this.trimmed(process.env.REACT_APP_RELEASE),
      sentryDsn: this.trimmed(process.env.REACT_APP_SENTRY_DSN),
      sentryEnvironment: this.trimmed(process.env.REACT_APP_SENTRY_ENVIRONMENT),
      authFailureAlertThreshold: authFailureAlert.threshold,
      authFailureAlertWindowMs: authFailureAlert.windowMs,
    };
  }

  private trimmed(value: string | undefined): string | undefined {
    return value?.trim() || undefined;
  }
}

const rawEnv = new RawEnv();

export default rawEnv;
