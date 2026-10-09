export type FeatureFlag = 'forgotPassword';

export interface FeatureFlagNames {
  readonly items: readonly FeatureFlag[];
}

export interface FeatureFlagSnapshot {
  readonly forgotPassword: boolean;
}

export interface FeatureFlagValues {
  readonly forgotPassword?: boolean | undefined;
}
