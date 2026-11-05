import Box from '@mui/material/Box';
import { type JSX, useState } from 'react';
import { useTranslation } from 'react-i18next';

import type { UISidebarProps } from '@/components/types/ui-sidebar';
import UINavigationList from '@/components/ui-navigation-list';

import CollapseHandle from './collapse-handle';
import styles from './styles';
import useSidebarCollapse from './use-sidebar-collapse';

export default function UISidebar({ layout, items, signOut }: UISidebarProps): JSX.Element {
  const { t } = useTranslation();
  const { collapsed, flip } = useSidebarCollapse();
  const [revealing, setRevealing] = useState(false);
  const state = collapsed ? 'rail' : 'expanded';
  const toggle = (): void => {
    setRevealing(collapsed);
    flip();
  };

  return (
    <Box sx={styles.wrapper[layout][state]}>
      <CollapseHandle layout={layout} collapsed={collapsed} onToggle={toggle} />
      <Box
        component="nav"
        aria-label={t('app_shell.navigation.label')}
        onAnimationEnd={() => setRevealing(false)}
        sx={revealing ? { ...styles.panel[layout], ...styles.reveal } : styles.panel[layout]}
      >
        <UINavigationList layout={layout} variant={state} items={items} signOut={signOut} />
      </Box>
    </Box>
  );
}
