export type FeatureFlag = 'contacts-module' | 'deals-module' | 'tenant-switcher';

export type FeatureFlagState = Readonly<Partial<Record<FeatureFlag, boolean>>>;

export type FeatureFlagDefaults = Readonly<Record<FeatureFlag, boolean>>;
