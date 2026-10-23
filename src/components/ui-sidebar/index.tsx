import Box from '@mui/material/Box';
import { type JSX, useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';

import type { UISidebarProps } from '@/components/types/ui-sidebar';
import UINavigationList from '@/components/ui-navigation-list';

import CollapseHandle from './collapse-handle';
import styles from './styles';

export default function UISidebar({ layout, items, signOut }: UISidebarProps): JSX.Element {
  const { t } = useTranslation();
  const [collapsed, setCollapsed] = useState(false);
  const toggle = useCallback(() => setCollapsed((current) => !current), []);
  const state = collapsed ? 'rail' : 'expanded';

  return (
    <Box sx={styles.wrapper[layout][state]}>
      <CollapseHandle layout={layout} collapsed={collapsed} onToggle={toggle} />
      <Box component="nav" aria-label={t('app_shell.navigation.label')} sx={styles.panel[layout]}>
        <UINavigationList layout={layout} variant={state} items={items} signOut={signOut} />
      </Box>
    </Box>
  );
}
