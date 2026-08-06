import { injectable } from 'tsyringe';

import accessCore from '@/lib/access/access-core';
import type { FeatureFlags } from '@/lib/types/access/access-services';
import type { FeatureFlag } from '@/lib/types/access/feature-flag';

@injectable()
export default class FeatureFlagService implements FeatureFlags {
  public isEnabled(flag: FeatureFlag): boolean {
    return accessCore.isEnabled(flag);
  }
}
