import Box from '@mui/material/Box';
import Modal from '@mui/material/Modal';
import Slide from '@mui/material/Slide';
import useMediaQuery from '@mui/material/useMediaQuery';
import type { JSX } from 'react';
import { useTranslation } from 'react-i18next';

import type { UINavigationDrawerProps } from '@/components/types/ui-navigation-drawer';

import DrawerHeader from './drawer-header';
import DrawerPanel from './drawer-panel';
import styles from './styles';

const MOTION_MS = 200;

export default function UINavigationDrawer({
  open,
  id,
  items,
  signOut,
  onClose,
  onNavigate,
}: UINavigationDrawerProps): JSX.Element {
  const { t } = useTranslation();
  const reduced = useMediaQuery('(prefers-reduced-motion: reduce)');
  const duration = reduced ? 0 : MOTION_MS;

  return (
    <Modal
      open={open}
      onClose={onClose}
      disableRestoreFocus
      disableEnforceFocus
      slotProps={{ backdrop: { sx: styles.backdrop, transitionDuration: duration } }}
    >
      <Box
        id={id}
        role="dialog"
        aria-modal="true"
        aria-label={t('app_shell.navigation.label')}
        tabIndex={-1}
        sx={styles.dialog}
      >
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
