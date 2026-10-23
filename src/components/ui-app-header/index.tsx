import Box from '@mui/material/Box';
import type { JSX } from 'react';

import type { UIAppHeaderProps } from '@/components/types/ui-app-header';

import HeaderIconButton from './header-icon-button';
import HeaderLogo from './header-logo';
import HeaderSearch from './header-search';
import MobileNavigation from './mobile-navigation';
import styles from './styles';
import UserSlotFrame from './user-slot-frame';

export default function UIAppHeader({
  layout,
  navigation,
  badgeCounts,
  userMenu,
}: UIAppHeaderProps): JSX.Element {
  return (
    <Box component="header" sx={styles.header[layout]}>
      <HeaderLogo layout={layout} />
      <Box sx={styles.cluster[layout]}>
        {layout !== 'mobile' && <HeaderSearch layout={layout} />}
        <HeaderIconButton layout={layout} kind="notifications" count={badgeCounts?.notifications} />
        <HeaderIconButton layout={layout} kind="tasks" count={badgeCounts?.tasks} />
        <UserSlotFrame layout={layout}>{userMenu}</UserSlotFrame>
        {layout === 'mobile' && navigation && (
          <MobileNavigation items={navigation.items} signOut={navigation.signOut} />
        )}
      </Box>
    </Box>
  );
}
