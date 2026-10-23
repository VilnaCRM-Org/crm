import Box from '@mui/material/Box';
import type { JSX } from 'react';
import { useTranslation } from 'react-i18next';

import { ReactComponent as SignOutIcon } from '@/assets/icons/shell/log-in-02.svg';
import type { NavigationSignOutProps } from '@/components/types/ui-navigation-list';

import NavigationRailItem from './navigation-rail-item';
import NavigationRow from './navigation-row';
import styles from './styles';

const DIVIDERS = {
  desktop: styles.divider.desktopRail,
  tablet: styles.divider.tabletRail,
};

export default function NavigationSignOut({
  layout,
  variant,
  onSignOut,
}: NavigationSignOutProps): JSX.Element {
  const { t } = useTranslation();
  const rail = variant === 'rail';
  const label = t('app_shell.sign_out');

  return (
    <Box component="li" sx={styles.signOut}>
      <Box
        component="hr"
        aria-hidden="true"
        sx={rail ? DIVIDERS[layout] : styles.divider.expanded}
      />
      {rail ? (
        <NavigationRailItem
          layout={layout}
          id="signOut"
          label={label}
          icon={SignOutIcon}
          onActivate={onSignOut}
        />
      ) : (
        <NavigationRow
          layout={layout}
          variant="item"
          id="signOut"
          label={label}
          icon={SignOutIcon}
          onActivate={onSignOut}
        />
      )}
    </Box>
  );
}
