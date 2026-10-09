import appConfigSource from './app-config-source';
import type { FeatureFlag, FeatureFlagNames, FeatureFlagSnapshot } from './types/feature-flag';

const FEATURE_FLAG_DEFAULTS: Readonly<Record<FeatureFlag, boolean>> = Object.freeze({
  forgotPassword: false,
});

export class FeatureFlagService {
  public isEnabled(flag: FeatureFlag): boolean {
    const value = appConfigSource.flags()[flag];

    return typeof value === 'boolean' ? value : FEATURE_FLAG_DEFAULTS[flag];
  }

  public names(): FeatureFlagNames {
    return { items: Object.keys(FEATURE_FLAG_DEFAULTS) as FeatureFlag[] };
  }

  public snapshot(): FeatureFlagSnapshot {
    const entries = this.names().items.map((flag) => [flag, this.isEnabled(flag)]);

    return Object.fromEntries(entries) as FeatureFlagSnapshot;
  }
}

const featureFlagService = new FeatureFlagService();

export default featureFlagService;
