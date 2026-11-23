import type { FeatureFlagValues } from './feature-flag';
import type { NotificationStyle } from './notification-style';

export interface AppConfigValues {
  readonly apiBaseUrl?: string | undefined;
  readonly graphqlUrl?: string | undefined;
  readonly notificationEventsUrl?: string | undefined;
  readonly flags?: FeatureFlagValues | undefined;
  readonly notificationStyle?: NotificationStyle | undefined;
}

export type AppConfigUrlKey = 'apiBaseUrl' | 'graphqlUrl' | 'notificationEventsUrl';

export type AppConfigChoiceKey = 'notificationStyle';

export type AppConfigTextKey = AppConfigUrlKey | AppConfigChoiceKey;

export type AppConfigChoices = { readonly [Key in AppConfigChoiceKey]: ReadonlySet<string> };

export type AppConfigParse = (raw: unknown) => AppConfigValues;

export interface AppConfigReader {
  get(): AppConfigValues;
  apiBaseUrl(): string | undefined;
  graphqlUrl(): string | undefined;
}
