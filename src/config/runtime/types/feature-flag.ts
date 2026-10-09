export type FeatureFlag = never;

export type FeatureFlagValues = [FeatureFlag] extends [never]
  ? Readonly<Record<string, never>>
  : Readonly<Partial<Record<FeatureFlag, boolean | undefined>>>;
