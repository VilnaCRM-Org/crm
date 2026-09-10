import { inject, injectable } from 'tsyringe';

import type { AccessCore } from '@/lib/access/access-core';
import type { MutationChecker } from '@/lib/types/access/access-services';
import type { MutationKey } from '@/lib/types/access/mutation-access';

import ACCESS_TOKENS from './tokens';

// The non-React half of the guard: logic that is about to fire a mutation asks here, so a
// repository or service reaches the same supplied set the UI gate reads.
@injectable()
export default class MutationAccessService implements MutationChecker {
  constructor(@inject(ACCESS_TOKENS.AccessCore) private readonly core: AccessCore) {}

  public can(mutation: MutationKey): boolean {
    return this.core.can(mutation);
  }
}
