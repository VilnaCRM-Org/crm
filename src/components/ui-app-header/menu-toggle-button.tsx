import Box from '@mui/material/Box';
import type { JSX } from 'react';
import { useTranslation } from 'react-i18next';

import { ReactComponent as MenuIcon } from '@/assets/icons/shell/menu-04.svg';
import type { MenuToggleButtonProps } from '@/components/types/ui-app-header';

import styles from './burger-styles';

export default function MenuToggleButton({
  open,
  controls,
  onToggle,
  ref,
}: MenuToggleButtonProps): JSX.Element {
  const { t } = useTranslation();

  return (
    <Box
      component="button"
      type="button"
      ref={ref}
      aria-label={t('app_shell.drawer.open')}
      aria-expanded={open}
      aria-haspopup="dialog"
      aria-controls={open ? controls : undefined}
      onClick={onToggle}
      sx={styles.burger}
    >
      <Box component={MenuIcon} aria-hidden="true" focusable="false" sx={styles.glyph} />
    </Box>
  );
}
