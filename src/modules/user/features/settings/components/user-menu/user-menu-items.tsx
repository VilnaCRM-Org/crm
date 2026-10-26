import MenuItem from '@mui/material/MenuItem';
import MenuList from '@mui/material/MenuList';
import { type JSX, useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import type { UserMenuItemsProps } from '../../types/components/user-menu';

import styles from './styles';
import UserMenuLink from './user-menu-link';

export default function UserMenuItems({
  layout,
  menuId,
  settingsAvailable,
  menu,
  signOut,
}: UserMenuItemsProps): JSX.Element {
  const { t } = useTranslation();
  const leave = useCallback(() => {
    menu.close();
    signOut();
  }, [menu, signOut]);

  return (
    <MenuList
      id={menuId}
      variant="menu"
      autoFocusItem
      aria-label={t('user_menu.button')}
      onKeyDown={menu.menuKeyDown}
      sx={styles.list[layout]}
    >
      {settingsAvailable && (
        <UserMenuLink layout={layout} label={t('user_menu.my_profile')} onClose={menu.close} />
      )}
      {settingsAvailable && (
        <UserMenuLink layout={layout} label={t('user_menu.settings')} onClose={menu.close} />
      )}
      <MenuItem disableRipple disableGutters onClick={leave} sx={styles.item[layout]}>
        {t('user_menu.sign_out')}
      </MenuItem>
    </MenuList>
  );
}
