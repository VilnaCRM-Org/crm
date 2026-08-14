import '../setup';

import featureFlags from '@/config/env/feature-flags';

const OAUTH_FLAG = 'REACT_APP_FEATURE_OAUTH_PROVIDERS';
const REMEMBER_ME_FLAG = 'REACT_APP_FEATURE_REMEMBER_ME';

describe('featureFlags Integration', () => {
  const ORIGINAL_ENV = { ...process.env };

  afterEach(() => {
    process.env = { ...ORIGINAL_ENV };
  });

  it('keeps both auth feature flags off when the variables are absent', () => {
    delete process.env[OAUTH_FLAG];
    delete process.env[REMEMBER_ME_FLAG];

    expect(featureFlags.oauthProviders()).toBe(false);
    expect(featureFlags.rememberMe()).toBe(false);
  });

  it('enables each flag independently from its own variable', () => {
    process.env[OAUTH_FLAG] = 'true';
    process.env[REMEMBER_ME_FLAG] = '1';

    expect(featureFlags.oauthProviders()).toBe(true);
    expect(featureFlags.rememberMe()).toBe(true);
  });

  it('treats non-boolean values as off', () => {
    process.env[OAUTH_FLAG] = 'enabled';
    process.env[REMEMBER_ME_FLAG] = 'TRUE';

    expect(featureFlags.oauthProviders()).toBe(false);
    expect(featureFlags.rememberMe()).toBe(false);
  });
});
