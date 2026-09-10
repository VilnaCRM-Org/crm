import type { FeatureFlag, FeatureFlagDefaults } from '@/lib/types/access/feature-flag';

const FEATURE_FLAGS = Object.freeze({
  contactsModule: 'contacts-module',
  dealsModule: 'deals-module',
  tenantSwitcher: 'tenant-switcher',
} as const) satisfies Readonly<Record<string, FeatureFlag>>;

const FEATURE_FLAG_DEFAULTS: FeatureFlagDefaults = Object.freeze({
  'contacts-module': false,
  'deals-module': false,
  'tenant-switcher': true,
});

export { FEATURE_FLAG_DEFAULTS, FEATURE_FLAGS };
