import Box from '@mui/material/Box';
import { type JSX, useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import type { DrawerPanelProps } from '@/components/types/ui-navigation-drawer';
import HeaderSearch from '@/components/ui-app-header/header-search';
import UINavigationList from '@/components/ui-navigation-list';

import useCloseOnNavigation from './use-close-on-navigation';

export default function DrawerPanel({ items, signOut, onNavigate }: DrawerPanelProps): JSX.Element {
  const { t } = useTranslation();
  useCloseOnNavigation(onNavigate);
  const leave = useCallback(() => {
    onNavigate();
    signOut();
  }, [onNavigate, signOut]);

  return (
    <>
      <HeaderSearch layout="drawer" />
      <Box component="nav" aria-label={t('app_shell.navigation.label')}>
        <UINavigationList layout="drawer" variant="expanded" items={items} signOut={leave} />
      </Box>
    </>
  );
}
