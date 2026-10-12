export type FeatureFlag = 'forgotPassword';

export interface FeatureFlagName {
  readonly name: FeatureFlag;
}

export interface FeatureFlagNames {
  readonly items: readonly FeatureFlagName[];
}

export interface FeatureFlagSnapshot {
  readonly forgotPassword: boolean;
}

export interface FeatureFlagValues {
  readonly forgotPassword?: boolean | undefined;
}
