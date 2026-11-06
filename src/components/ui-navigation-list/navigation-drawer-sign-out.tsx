import Box from '@mui/material/Box';
import type { JSX } from 'react';
import { useTranslation } from 'react-i18next';

import { ReactComponent as SignOutIcon } from '@/assets/icons/shell/log-in-02.svg';
import type { NavigationDrawerSignOutProps } from '@/components/types/ui-navigation-list';

import NavigationRow from './navigation-row';
import styles from './styles';

export default function NavigationDrawerSignOut({
  onSignOut,
}: NavigationDrawerSignOutProps): JSX.Element {
  const { t } = useTranslation();

  return (
    <Box component="li" sx={styles.signOutDrawer}>
      <NavigationRow
        layout="drawer"
        variant="item"
        id="signOut"
        label={t('app_shell.sign_out')}
        icon={SignOutIcon}
        onActivate={onSignOut}
      />
    </Box>
  );
}
