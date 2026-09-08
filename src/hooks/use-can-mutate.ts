import useAccess from '@/hooks/use-access';
import mutationAccessCore from '@/lib/access/mutation-access-core';
import type { MutationKey } from '@/lib/types/access/mutation-access';

export default function useCanMutate(mutation: MutationKey): boolean {
  return mutationAccessCore.can(useAccess().principal, mutation);
}
