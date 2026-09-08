import type { MutationKey } from '@/lib/types/access/mutation-access';
import type { Principal } from '@/lib/types/access/principal';

export class MutationAccessCore {
  public can(principal: Principal | null, mutation: MutationKey): boolean {
    return principal !== null && principal.allowedMutations.includes(mutation);
  }
}

const mutationAccessCore = new MutationAccessCore();

export default mutationAccessCore;
