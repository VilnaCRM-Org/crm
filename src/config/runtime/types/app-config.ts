import type { FeatureFlagValues } from './feature-flag';

export interface AppConfigValues {
  readonly apiBaseUrl?: string;
  readonly graphqlUrl?: string;
  readonly flags?: FeatureFlagValues;
}

export interface AppConfigReader {
  get(): AppConfigValues;
  apiBaseUrl(): string | undefined;
  graphqlUrl(): string | undefined;
}
