import { faker } from '@faker-js/faker';

import type { AppConfigReader, AppConfigValues } from '@/config/runtime/types/app-config';
import type { FeatureFlag } from '@/config/runtime/types/feature-flag';

export function buildHttpUrl(path = ''): string {
  return `${faker.internet.url({ appendSlash: false })}${path}`;
}

export function buildAppConfigValues(overrides: Partial<AppConfigValues> = {}): AppConfigValues {
  return { ...overrides };
}

/**
 * Stub of the `AppConfigReader` contract that `GraphQLUrl` injects. Defaults to "no runtime
 * configuration supplied", which is the shape every existing build-time fallback path expects.
 */
export function buildAppConfigReader(values: AppConfigValues = {}): AppConfigReader {
  return {
    get: (): AppConfigValues => values,
    apiBaseUrl: (): string | undefined => values.apiBaseUrl,
    graphqlUrl: (): string | undefined => values.graphqlUrl,
  };
}

export function buildFeatureFlagConfig(flags: Partial<Record<FeatureFlag, boolean>>): string {
  return JSON.stringify({ flags });
}
