import Box from '@mui/material/Box';
import type { JSX } from 'react';
import { useTranslation } from 'react-i18next';

import { ReactComponent as ChevronIcon } from '@/assets/icons/shell/chevron-left.svg';
import type { CollapseHandleProps } from '@/components/types/ui-sidebar';

import styles from './styles';

export default function CollapseHandle({
  layout,
  collapsed,
  onToggle,
}: CollapseHandleProps): JSX.Element {
  const { t } = useTranslation();
  const state = collapsed ? 'rail' : 'expanded';

  return (
    <Box
      component="button"
      type="button"
      aria-expanded={!collapsed}
      aria-label={t(collapsed ? 'app_shell.sidebar.expand' : 'app_shell.sidebar.collapse')}
      onClick={onToggle}
      sx={styles.handle[layout][state]}
    >
      <Box
        component={ChevronIcon}
        aria-hidden="true"
        focusable="false"
        sx={{ ...styles.handleGlyph[layout], ...styles.handlePoints[state] }}
      />
    </Box>
  );
}
