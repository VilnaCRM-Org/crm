import { buildFeatureFlagConfig } from '@tests/builders';
import { clearConfigBlock, writeConfigBlock } from '@tests/utils/config-block';

type FeatureFlagModule = typeof import('@/config/runtime/feature-flag-service');

const ALL_OFF = { forgotPassword: false, oauthProviders: false, rememberMe: false };

function loadFeatureFlagService(): Promise<FeatureFlagModule> {
  jest.resetModules();

  return import('@/config/runtime/feature-flag-service');
}

describe('featureFlagService', () => {
  beforeEach(() => {
    clearConfigBlock();
  });

  afterAll(() => {
    clearConfigBlock();
  });

  it('falls back to the compiled-in default when no runtime configuration is present', async () => {
    const { default: featureFlagService, FeatureFlagService } = await loadFeatureFlagService();

    expect(featureFlagService).toBeInstanceOf(FeatureFlagService);
    expect(featureFlagService.isEnabled('forgotPassword')).toBe(false);
    expect(featureFlagService.snapshot()).toEqual(ALL_OFF);
  });

  it.each(['forgotPassword', 'oauthProviders', 'rememberMe'] as const)(
    'enables %s when the runtime configuration turns it on',
    async (flag) => {
      writeConfigBlock(buildFeatureFlagConfig({ [flag]: true }));

      const { default: featureFlagService } = await loadFeatureFlagService();

      expect(featureFlagService.isEnabled(flag)).toBe(true);
      expect(featureFlagService.snapshot()).toEqual({ ...ALL_OFF, [flag]: true });
    }
  );

  it.each(['forgotPassword', 'oauthProviders', 'rememberMe'] as const)(
    'disables %s when the runtime configuration turns it off',
    async (flag) => {
      writeConfigBlock(buildFeatureFlagConfig({ [flag]: false }));

      const { default: featureFlagService } = await loadFeatureFlagService();

      expect(featureFlagService.isEnabled(flag)).toBe(false);
      expect(featureFlagService.snapshot()).toEqual(ALL_OFF);
    }
  );

  it('keeps the auth control flags independent of one another', async () => {
    writeConfigBlock(buildFeatureFlagConfig({ oauthProviders: true }));

    const { default: featureFlagService } = await loadFeatureFlagService();

    expect(featureFlagService.isEnabled('oauthProviders')).toBe(true);
    expect(featureFlagService.isEnabled('rememberMe')).toBe(false);
    expect(featureFlagService.isEnabled('forgotPassword')).toBe(false);
  });

  it.each([
    ['the string "true"', 'true'],
    ['the number 1', 1],
    ['null', null],
  ])('ignores %s and keeps the default, because it is not a boolean', async (_label, value) => {
    writeConfigBlock(JSON.stringify({ flags: { forgotPassword: value } }));

    const { default: featureFlagService } = await loadFeatureFlagService();

    expect(featureFlagService.isEnabled('forgotPassword')).toBe(false);
  });

  it('names every flag it knows about', async () => {
    const { default: featureFlagService } = await loadFeatureFlagService();

    expect(featureFlagService.names()).toEqual(['forgotPassword', 'oauthProviders', 'rememberMe']);
  });
});
