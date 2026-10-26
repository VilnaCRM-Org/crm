import Box from '@mui/material/Box';
import type { JSX } from 'react';

import type { UIAppShellProps } from '@/components/types/ui-app-shell';
import UIAppHeader from '@/components/ui-app-header';
import UISidebar from '@/components/ui-sidebar';
import i18n from '@/i18n';
import lazyCatalogLoader from '@/lib/locale-catalog/lazy-catalog-loader';

import en from './i18n/en.json';
import uk from './i18n/uk.json';
import navigationItems from './navigation-items';
import styles from './styles';
import useShellLayout from './use-shell-layout';

lazyCatalogLoader.register(i18n, { en, uk });

export default function UIAppShell({ signOut, userMenu: UserMenu }: UIAppShellProps): JSX.Element {
  const layout = useShellLayout();

  return (
    <>
      <Box sx={styles.header}>
        <UIAppHeader
          layout={layout}
          navigation={{ items: navigationItems, signOut }}
          userMenu={UserMenu === undefined ? undefined : <UserMenu signOut={signOut} />}
        />
      </Box>
      {layout !== 'mobile' && (
        <Box sx={styles.nav[layout]}>
          <Box sx={styles.sticky}>
            <UISidebar layout={layout} items={navigationItems} signOut={signOut} />
          </Box>
        </Box>
      )}
    </>
  );
}
