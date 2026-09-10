export type FeatureFlag = 'forgotPassword' | 'accessCatalogueSource';

export interface FeatureFlagValues {
  readonly forgotPassword?: boolean;
  readonly accessCatalogueSource?: boolean;
}
