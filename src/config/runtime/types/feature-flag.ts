export type FeatureFlag = 'userSettings';

export interface FeatureFlagName {
  readonly name: FeatureFlag;
}

export interface FeatureFlagNames {
  readonly items: readonly FeatureFlagName[];
}

export type FeatureFlagSnapshot = { readonly [Flag in FeatureFlag]: boolean };

export type FeatureFlagValues = { readonly [Flag in FeatureFlag]?: boolean | undefined };
