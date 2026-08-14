class FeatureFlags {
  public oauthProviders(): boolean {
    return this.enabled(process.env.REACT_APP_FEATURE_OAUTH_PROVIDERS);
  }

  public rememberMe(): boolean {
    return this.enabled(process.env.REACT_APP_FEATURE_REMEMBER_ME);
  }

  private enabled(value: string | undefined): boolean {
    const normalized = value?.trim();
    return normalized === 'true' || normalized === '1';
  }
}

const featureFlags = new FeatureFlags();

export default featureFlags;
