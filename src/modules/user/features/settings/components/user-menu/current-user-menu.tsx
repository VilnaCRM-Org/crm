import { useEffect } from 'react';

import useCurrentUser from '../../hooks/use-current-user';
import type { CurrentUserMenuProps } from '../../types/components/user-menu';

export default function CurrentUserMenu({ onIdentity }: CurrentUserMenuProps): null {
  const { identity } = useCurrentUser();

  useEffect(() => {
    onIdentity(identity);
  }, [identity, onIdentity]);

  return null;
}
