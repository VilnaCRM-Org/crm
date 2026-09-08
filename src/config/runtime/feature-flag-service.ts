import appConfigSource from './app-config-source';
import type { FeatureFlag } from './types/feature-flag';

const FEATURE_FLAG_DEFAULTS: Readonly<Record<FeatureFlag, boolean>> = Object.freeze({
  forgotPassword: false,
  // Issue #114 delta, architecture D10: `true` selects the catalogue-backed session loader
  // (story 3.2) over the shipped claim-shape one. Ships off — the loader itself does not exist
  // yet — and is a deployment property, never a per-principal access flag.
  accessCatalogueSource: false,
});

export class FeatureFlagService {
  public isEnabled(flag: FeatureFlag): boolean {
    const value = appConfigSource.flags()[flag];

    return typeof value === 'boolean' ? value : FEATURE_FLAG_DEFAULTS[flag];
  }

  public names(): FeatureFlag[] {
    return Object.keys(FEATURE_FLAG_DEFAULTS) as FeatureFlag[];
  }

  public snapshot(): Record<FeatureFlag, boolean> {
    const entries = this.names().map((flag) => [flag, this.isEnabled(flag)]);

    return Object.fromEntries(entries) as Record<FeatureFlag, boolean>;
  }
}

const featureFlagService = new FeatureFlagService();

export default featureFlagService;
