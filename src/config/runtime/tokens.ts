const RUNTIME_TOKENS = Object.freeze({
  AppConfig: Symbol('AppConfig'),
  FeatureFlagService: Symbol('FeatureFlagService'),
} as const);

export default RUNTIME_TOKENS;
