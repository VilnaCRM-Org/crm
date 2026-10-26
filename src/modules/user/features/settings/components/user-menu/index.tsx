import Box from '@mui/material/Box';
import { type JSX, useId } from 'react';

import useShellLayout from '@/components/ui-app-shell/use-shell-layout';
import useOnceCallback from '@/hooks/use-once-callback';

import useUserMenu from '../../hooks/use-user-menu';
import type { UserMenuProps } from '../../types/components/user-menu';

import styles from './styles';
import UserChip from './user-chip';
import UserMenuCard from './user-menu-card';
import UserMenuItems from './user-menu-items';

export default function UserMenu({
  identity,
  settingsAvailable,
  signOut,
}: UserMenuProps): JSX.Element {
  const layout = useShellLayout();
  const menu = useUserMenu({ layout });
  const menuId = useId();
  const signOutOnce = useOnceCallback(signOut);

  return (
    <Box sx={styles.root[layout]}>
      {menu.open && <Box aria-hidden="true" onClick={menu.close} sx={styles.backdrop} />}
      <UserMenuCard
        layout={layout}
        open={menu.open}
        chip={<UserChip layout={layout} identity={identity} menu={menu} menuId={menuId} />}
        items={
          <UserMenuItems
            layout={layout}
            menuId={menuId}
            settingsAvailable={settingsAvailable}
            menu={menu}
            signOut={signOutOnce}
          />
        }
      />
    </Box>
  );
}
