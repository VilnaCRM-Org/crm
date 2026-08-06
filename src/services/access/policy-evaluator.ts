import { injectable } from 'tsyringe';

import accessCore from '@/lib/access/access-core';
import type { Policy } from '@/lib/types/access/policy';

@injectable()
export default class PolicyEvaluator {
  public evaluate<TSubject>(policy: Policy<TSubject>, subject: TSubject): boolean {
    const principal = accessCore.principal();
    if (principal === null) {
      accessCore.recordDenial(policy.permission);
      return false;
    }
    const satisfied = policy.isSatisfiedBy(principal, subject);
    if (!satisfied) accessCore.recordDenial(policy.permission);
    return satisfied;
  }
}
