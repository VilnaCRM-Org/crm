export type FeatureFlag = 'forgotPassword' | 'oauthProviders' | 'rememberMe';

export interface FeatureFlagValues {
  readonly forgotPassword?: boolean;
  readonly oauthProviders?: boolean;
  readonly rememberMe?: boolean;
}
