import type { ReactNode } from 'react';

import type { MutationKey } from '@/lib/types/access/mutation-access';

export interface RequireMutationProps {
  mutation: MutationKey;
  children: ReactNode;
}
