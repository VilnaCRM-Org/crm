import type { MutationKey } from '@/lib/types/access/mutation-access';

import auditCore from './audit-core';
import mutationCatalogue from './mutation-catalogue';

export class MutationKeyFilter {
  public filter(candidates: readonly string[]): readonly MutationKey[] {
    this.audit(candidates.filter((candidate) => !mutationCatalogue.isKey(candidate)));
    return candidates.filter((candidate): candidate is MutationKey =>
      mutationCatalogue.isKey(candidate)
    );
  }

  private audit(dropped: readonly string[]): void {
    if (dropped.length === 0) return;
    auditCore.log({ type: 'access_unknown_mutation', metadata: { mutations: dropped.join(',') } });
  }
}

const mutationKeyFilter = new MutationKeyFilter();

export default mutationKeyFilter;
