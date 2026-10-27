import appConfigSource from './app-config-source';
import type { FeatureFlag, FeatureFlagNames, FeatureFlagSnapshot } from './types/feature-flag';

const FEATURE_FLAG_DEFAULTS: FeatureFlagSnapshot = Object.freeze({
  userSettings: false,
  twoFactorAuth: false,
});

export class FeatureFlagService {
  public isEnabled(flag: FeatureFlag): boolean {
    return appConfigSource.flag(flag) ?? FEATURE_FLAG_DEFAULTS[flag];
  }

  public names(): FeatureFlagNames {
    const flags = Object.keys(FEATURE_FLAG_DEFAULTS) as FeatureFlag[];

    return { items: flags.map((name) => ({ name })) };
  }

  public snapshot(): FeatureFlagSnapshot {
    const entries = this.names().items.map(({ name }) => [name, this.isEnabled(name)]);

    return Object.fromEntries(entries) as FeatureFlagSnapshot;
  }
}

const featureFlagService = new FeatureFlagService();

export default featureFlagService;
