import type { JSX } from 'react';

import useCurrentUser from '../../hooks/use-current-user';
import type { CurrentUserMenuProps } from '../../types/components/user-menu';

import UserMenu from '.';

export default function CurrentUserMenu({ signOut }: CurrentUserMenuProps): JSX.Element {
  const { identity } = useCurrentUser();

  return <UserMenu identity={identity} settingsAvailable signOut={signOut} />;
}
