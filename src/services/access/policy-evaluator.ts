import { inject, injectable } from 'tsyringe';

import type { AccessCore } from '@/lib/access/access-core';
import type { Policy } from '@/lib/types/access/policy';

import ACCESS_TOKENS from './tokens';

@injectable()
export default class PolicyEvaluator {
  constructor(@inject(ACCESS_TOKENS.AccessCore) private readonly core: AccessCore) {}

  public evaluate<TSubject>(policy: Policy<TSubject>, subject: TSubject): boolean {
    const principal = this.core.principal();
    if (principal === null) {
      this.core.recordDenial(policy.permission);
      return false;
    }
    const satisfied = policy.isSatisfiedBy(principal, subject);
    if (!satisfied) this.core.recordDenial(policy.permission);
    return satisfied;
  }
}
