import { useMemo } from 'react';

import AUTH_TOKENS from '@/modules/user/config/tokens';
import type UserDisplayNameMapper from '@/modules/user/store/user-display-name-mapper';
import { useService } from '@/providers/di';

import type { DisplayNameState } from '../types/hooks/use-display-name';

export default function useDisplayName(fullName: string): DisplayNameState {
  const mapper = useService<UserDisplayNameMapper>(AUTH_TOKENS.UserDisplayNameMapper);

  return useMemo(() => mapper.fromFullName(fullName), [mapper, fullName]);
}
