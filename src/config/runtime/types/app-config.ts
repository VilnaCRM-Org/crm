import type { FeatureFlagValues } from './feature-flag';

export interface AppConfigValues {
  readonly apiBaseUrl?: string | undefined;
  readonly graphqlUrl?: string | undefined;
  readonly flags?: FeatureFlagValues | undefined;
}

export type AppConfigUrlKey = 'apiBaseUrl' | 'graphqlUrl';

export type AppConfigParse = (raw: unknown) => AppConfigValues;

export interface AppConfigReader {
  get(): AppConfigValues;
  apiBaseUrl(): string | undefined;
  graphqlUrl(): string | undefined;
}
