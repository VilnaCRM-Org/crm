import Box from '@mui/material/Box';
import { type JSX, type ReactNode, useState } from 'react';

import type { UIAppShellProps } from '@/components/types/ui-app-shell';
import UIAppHeader from '@/components/ui-app-header';
import UISidebar from '@/components/ui-sidebar';
import i18n from '@/i18n';
import lazyCatalogLoader from '@/lib/locale-catalog/lazy-catalog-loader';
import type { ShellSlot, ShellSlotHostProps } from '@/routes/types/shell-slot';

import en from './i18n/en.json';
import uk from './i18n/uk.json';
import navigationItems from './navigation-items';
import styles from './styles';
import useShellLayout from './use-shell-layout';
import useStickyFocusClearance from './use-sticky-focus-clearance';

lazyCatalogLoader.register(i18n, { en, uk });

function slotElement(Slot: ShellSlot | undefined, host: ShellSlotHostProps): ReactNode {
  if (Slot === undefined) return undefined;

  return <Slot layout={host.layout} signOut={host.signOut} onAvatar={host.onAvatar} />;
}

export default function UIAppShell({
  signOut,
  userMenu: UserMenu,
  notifications: Notifications,
}: UIAppShellProps): JSX.Element {
  const layout = useShellLayout();
  const [avatar, setAvatar] = useState<ReactNode>(null);
  const clearHeaderOnFocus = useStickyFocusClearance();
  const host = { layout, signOut, onAvatar: setAvatar };

  return (
    <>
      <Box sx={styles.header}>
        <UIAppHeader
          layout={layout}
          navigation={{ items: navigationItems, signOut, avatar }}
          userMenu={slotElement(UserMenu, host)}
          notifications={slotElement(Notifications, host)}
        />
      </Box>
      {layout !== 'mobile' && (
        <Box sx={styles.nav[layout]}>
          <Box sx={styles.sticky} onFocus={clearHeaderOnFocus}>
            <UISidebar layout={layout} items={navigationItems} signOut={signOut} />
          </Box>
        </Box>
      )}
    </>
  );
}
