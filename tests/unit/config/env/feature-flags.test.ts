import featureFlags from '@/config/env/feature-flags';

const OAUTH_FLAG = 'REACT_APP_FEATURE_OAUTH_PROVIDERS';
const REMEMBER_ME_FLAG = 'REACT_APP_FEATURE_REMEMBER_ME';
const ORIGINAL_ENV = { ...process.env };

afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
});

describe('featureFlags.oauthProviders', () => {
  it.each([
    ['true', true],
    ['1', true],
    [' true ', true],
    ['TRUE', false],
    ['false', false],
    ['0', false],
    ['yes', false],
    ['', false],
    ['  ', false],
  ])('parses %j as %p', (value, expected) => {
    process.env[OAUTH_FLAG] = value;
    expect(featureFlags.oauthProviders()).toBe(expected);
  });

  it('defaults to off when the variable is absent', () => {
    delete process.env[OAUTH_FLAG];
    expect(featureFlags.oauthProviders()).toBe(false);
  });

  it('reads lazily so a per-test env change is observed', () => {
    delete process.env[OAUTH_FLAG];
    expect(featureFlags.oauthProviders()).toBe(false);
    process.env[OAUTH_FLAG] = '1';
    expect(featureFlags.oauthProviders()).toBe(true);
  });
});

describe('featureFlags.rememberMe', () => {
  it.each([
    ['true', true],
    ['1', true],
    ['0', false],
    ['', false],
  ])('parses %j as %p', (value, expected) => {
    process.env[REMEMBER_ME_FLAG] = value;
    expect(featureFlags.rememberMe()).toBe(expected);
  });

  it('defaults to off when the variable is absent', () => {
    delete process.env[REMEMBER_ME_FLAG];
    expect(featureFlags.rememberMe()).toBe(false);
  });

  it('is independent from the OAuth flag', () => {
    process.env[OAUTH_FLAG] = 'true';
    delete process.env[REMEMBER_ME_FLAG];
    expect(featureFlags.rememberMe()).toBe(false);
    expect(featureFlags.oauthProviders()).toBe(true);
  });
});
