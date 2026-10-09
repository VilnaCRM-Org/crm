export type FeatureFlag = never;

export type FeatureFlagValues = Readonly<Partial<Record<FeatureFlag, boolean>>>;
