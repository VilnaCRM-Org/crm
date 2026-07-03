class RawEnv {
  public mockoonUrl(): string {
    return process.env.REACT_APP_MOCKOON_URL?.trim() ?? '';
  }

  public lhciPreloadedAuthToken(): string | undefined {
    return this.trimmed(process.env.REACT_APP_LHCI_PRELOADED_AUTH_TOKEN);
  }

  public snapshot(): Record<string, string | undefined> {
    return {
      nodeEnv: process.env.NODE_ENV,
      graphqlUrl: this.trimmed(process.env.REACT_APP_GRAPHQL_URL),
      mockoonUrl: this.trimmed(process.env.REACT_APP_MOCKOON_URL),
      lhciPreloadedAuthToken: this.trimmed(process.env.REACT_APP_LHCI_PRELOADED_AUTH_TOKEN),
      mainLanguage: this.trimmed(process.env.REACT_APP_MAIN_LANGUAGE),
      fallbackLanguage: this.trimmed(process.env.REACT_APP_FALLBACK_LANGUAGE),
    };
  }

  private trimmed(value: string | undefined): string | undefined {
    return value?.trim() || undefined;
  }
}

const rawEnv = new RawEnv();

export default rawEnv;
