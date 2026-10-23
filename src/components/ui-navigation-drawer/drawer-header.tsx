import Box from '@mui/material/Box';
import type { JSX, RefCallback } from 'react';
import { useTranslation } from 'react-i18next';

import logoMobile from '@/assets/icons/shell/logo-mobile.svg';
import { ReactComponent as CloseIcon } from '@/assets/icons/shell/x-close.svg';
import type { DrawerHeaderProps } from '@/components/types/ui-navigation-drawer';

import DrawerHeaderCopies from './drawer-header-copies';
import styles from './styles';

const focusOnMount: RefCallback<HTMLButtonElement> = (node) => {
  node?.focus();
};

export default function DrawerHeader({ onDismiss }: DrawerHeaderProps): JSX.Element {
  const { t } = useTranslation();

  return (
    <Box role="presentation" onClick={onDismiss} sx={styles.header}>
      <Box component="img" src={logoMobile} alt="" aria-hidden="true" sx={styles.logo} />
      <Box sx={styles.cluster}>
        <DrawerHeaderCopies />
        <Box
          component="button"
          type="button"
          ref={focusOnMount}
          aria-label={t('app_shell.drawer.close')}
          sx={styles.close}
        >
          <Box component={CloseIcon} aria-hidden="true" focusable="false" sx={styles.closeGlyph} />
        </Box>
      </Box>
    </Box>
  );
}
