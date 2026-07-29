class RawEnv {
  public mockoonUrl(): string {
    return this.trimmed(process.env.REACT_APP_MOCKOON_URL) ?? '';
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

  public snapshot(): Record<string, string | undefined> {
    return {
      nodeEnv: process.env.NODE_ENV,
      graphqlUrl: this.trimmed(process.env.REACT_APP_GRAPHQL_URL),
      mockoonUrl: this.trimmed(process.env.REACT_APP_MOCKOON_URL),
      mainLanguage: this.trimmed(process.env.REACT_APP_MAIN_LANGUAGE),
      fallbackLanguage: this.trimmed(process.env.REACT_APP_FALLBACK_LANGUAGE),
      release: this.trimmed(process.env.REACT_APP_RELEASE),
      sentryDsn: this.trimmed(process.env.REACT_APP_SENTRY_DSN),
      sentryEnvironment: this.trimmed(process.env.REACT_APP_SENTRY_ENVIRONMENT),
    };
  }

  private trimmed(value: string | undefined): string | undefined {
    return value?.trim() || undefined;
  }
}

const rawEnv = new RawEnv();

export default rawEnv;
