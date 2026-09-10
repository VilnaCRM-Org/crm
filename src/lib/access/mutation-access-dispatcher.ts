import type { MutationKey } from '@/lib/types/access/mutation-access';
import type { MutationAccessResolver, SessionInput } from '@/lib/types/access/session';

import accessState from './access-state';
import claimsMutationResolver from './claims-mutation-resolver';

export class MutationAccessDispatcher {
  private resolver: MutationAccessResolver = claimsMutationResolver;

  public useResolver(resolver: MutationAccessResolver): void {
    this.resolver = resolver;
  }

  public async request(input: SessionInput): Promise<readonly MutationKey[]> {
    return this.publish(await this.resolve(input));
  }

  private async resolve(input: SessionInput): Promise<readonly MutationKey[]> {
    try {
      return await this.resolver.resolve(input);
    } catch {
      return [];
    }
  }

  private publish(allowed: readonly MutationKey[]): readonly MutationKey[] {
    const { principal, flags } = accessState.get();
    if (principal === null) return [];
    accessState.setSession({ ...principal, allowedMutations: allowed }, flags);
    return allowed;
  }
}

const mutationAccessDispatcher = new MutationAccessDispatcher();

export default mutationAccessDispatcher;
