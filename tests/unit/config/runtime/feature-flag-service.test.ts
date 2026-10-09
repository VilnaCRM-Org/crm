import { buildFeatureFlagConfig } from '@tests/builders';
import { clearConfigBlock, writeConfigBlock } from '@tests/utils/config-block';

type FeatureFlagModule = typeof import('@/config/runtime/feature-flag-service');

const PROBE_FLAG = 'probeFlag';

function loadFeatureFlagService(): Promise<FeatureFlagModule> {
  jest.resetModules();

  return import('@/config/runtime/feature-flag-service');
}

describe('featureFlagService', () => {
  beforeEach(() => {
    clearConfigBlock();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  afterAll(() => {
    clearConfigBlock();
  });

  it('declares no flags, so its names and snapshot are empty', async () => {
    const { default: featureFlagService, FeatureFlagService } = await loadFeatureFlagService();

    expect(featureFlagService).toBeInstanceOf(FeatureFlagService);
    expect(featureFlagService.names()).toEqual([]);
    expect(featureFlagService.snapshot()).toEqual({});
  });

  it('enables a flag the runtime configuration turns on', async () => {
    writeConfigBlock(buildFeatureFlagConfig({ [PROBE_FLAG]: true }));

    const { default: featureFlagService } = await loadFeatureFlagService();

    expect(featureFlagService.isEnabled(PROBE_FLAG as never)).toBe(true);
  });

  it('disables a flag the runtime configuration turns off', async () => {
    writeConfigBlock(buildFeatureFlagConfig({ [PROBE_FLAG]: false }));

    const { default: featureFlagService } = await loadFeatureFlagService();

    expect(featureFlagService.isEnabled(PROBE_FLAG as never)).toBe(false);
  });

  it.each([
    ['the string "true"', 'true'],
    ['the number 1', 1],
    ['null', null],
  ])('ignores %s and falls back to the compiled-in default', async (_label, value) => {
    writeConfigBlock(buildFeatureFlagConfig({ [PROBE_FLAG]: value }));

    const { default: featureFlagService } = await loadFeatureFlagService();

    expect(featureFlagService.isEnabled(PROBE_FLAG as never)).toBeUndefined();
  });

  it('snapshots every named flag through isEnabled', async () => {
    writeConfigBlock(buildFeatureFlagConfig({ [PROBE_FLAG]: true, otherFlag: false }));

    const { default: featureFlagService } = await loadFeatureFlagService();
    jest.spyOn(featureFlagService, 'names').mockReturnValue([PROBE_FLAG as never]);

    expect(featureFlagService.snapshot()).toEqual({ [PROBE_FLAG]: true });
  });
});
