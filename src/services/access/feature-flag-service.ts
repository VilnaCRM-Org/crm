import { inject, injectable } from 'tsyringe';

import type { AccessCore } from '@/lib/access/access-core';
import type { FeatureFlags } from '@/lib/types/access/access-services';
import type { FeatureFlag } from '@/lib/types/access/feature-flag';

import ACCESS_TOKENS from './tokens';

@injectable()
export default class FeatureFlagService implements FeatureFlags {
  constructor(@inject(ACCESS_TOKENS.AccessCore) private readonly core: AccessCore) {}

  public isEnabled(flag: FeatureFlag): boolean {
    return this.core.isEnabled(flag);
  }
}
