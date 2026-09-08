import type { MutationKey } from '@/lib/types/access/mutation-access';
import type { MutationAccessResolver, SessionInput } from '@/lib/types/access/session';

import sessionClaimsReader from './session-claims-reader';

export class ClaimsMutationResolver implements MutationAccessResolver {
  public resolve(input: SessionInput): Promise<readonly MutationKey[]> {
    return Promise.resolve(sessionClaimsReader.read(input.token)?.allowedMutations ?? []);
  }
}

const claimsMutationResolver = new ClaimsMutationResolver();

export default claimsMutationResolver;
