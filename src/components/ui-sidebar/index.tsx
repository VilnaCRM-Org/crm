import Box from '@mui/material/Box';
import type { JSX } from 'react';
import { useTranslation } from 'react-i18next';

import type { UISidebarProps } from '@/components/types/ui-sidebar';
import UINavigationList from '@/components/ui-navigation-list';

import CollapseHandle from './collapse-handle';
import styles from './styles';
import useSidebarCollapse from './use-sidebar-collapse';

export default function UISidebar({ layout, items, signOut }: UISidebarProps): JSX.Element {
  const { t } = useTranslation();
  const { collapsed, revealing, step } = useSidebarCollapse();
  const state = collapsed ? 'rail' : 'expanded';

  return (
    <Box sx={styles.wrapper[layout][state]}>
      <CollapseHandle layout={layout} collapsed={collapsed} onToggle={step} />
      <Box
        component="nav"
        aria-label={t('app_shell.navigation.label')}
        onAnimationEnd={step}
        sx={revealing ? { ...styles.panel[layout], ...styles.reveal } : styles.panel[layout]}
      >
        <UINavigationList layout={layout} variant={state} items={items} signOut={signOut} />
      </Box>
    </Box>
  );
}
