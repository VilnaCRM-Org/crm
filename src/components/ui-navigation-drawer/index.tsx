import Box from '@mui/material/Box';
import Modal from '@mui/material/Modal';
import Slide from '@mui/material/Slide';
import type { JSX } from 'react';
import { useTranslation } from 'react-i18next';

import type { UINavigationDrawerProps } from '@/components/types/ui-navigation-drawer';

import DrawerHeader from './drawer-header';
import DrawerPanel from './drawer-panel';
import DrawerScrim from './drawer-scrim';
import styles from './styles';
import useDrawerMotion from './use-drawer-motion';

export default function UINavigationDrawer({
  open,
  id,
  items,
  signOut,
  onClose,
  onNavigate,
}: UINavigationDrawerProps): JSX.Element {
  const { t } = useTranslation();
  const duration = useDrawerMotion();

  return (
    <Modal
      open={open}
      onClose={onClose}
      disableRestoreFocus
      disableEnforceFocus
      slotProps={{ backdrop: { invisible: true, transitionDuration: duration } }}
    >
      <Box
        id={id}
        role="dialog"
        aria-modal="true"
        aria-label={t('app_shell.navigation.label')}
        tabIndex={-1}
        sx={styles.dialog}
      >
        <DrawerScrim duration={duration} />
        <DrawerHeader onDismiss={onClose} />
        <Slide in appear direction="left" timeout={duration}>
          <Box sx={styles.panel}>
            <DrawerPanel items={items} signOut={signOut} onNavigate={onNavigate} />
          </Box>
        </Slide>
      </Box>
    </Modal>
  );
}
