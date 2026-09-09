import { buildFeatureFlagConfig } from '@tests/builders';
import { clearConfigBlock, writeConfigBlock } from '@tests/utils/config-block';

type FeatureFlagModule = typeof import('@/config/runtime/feature-flag-service');

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
    expect(featureFlagService.snapshot()).toEqual({ forgotPassword: false });
  });

  it('enables a flag the runtime configuration turns on', async () => {
    writeConfigBlock(buildFeatureFlagConfig({ forgotPassword: true }));

    const { default: featureFlagService } = await loadFeatureFlagService();

    expect(featureFlagService.isEnabled('forgotPassword')).toBe(true);
    expect(featureFlagService.snapshot()).toEqual({ forgotPassword: true });
  });

  it('disables a flag the runtime configuration turns off', async () => {
    writeConfigBlock(buildFeatureFlagConfig({ forgotPassword: false }));

    const { default: featureFlagService } = await loadFeatureFlagService();

    expect(featureFlagService.isEnabled('forgotPassword')).toBe(false);
    expect(featureFlagService.snapshot()).toEqual({ forgotPassword: false });
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

    expect(featureFlagService.names()).toEqual(['forgotPassword']);
  });
});
