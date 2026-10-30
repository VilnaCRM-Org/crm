import Box from '@mui/material/Box';
import type { JSX } from 'react';
import { useTranslation } from 'react-i18next';

import UIShellContent from '@/components/ui-shell-content';
import UITypography from '@/components/ui-typography';
import usePageTitle from '@/hooks/use-page-title';

import styles from './styles';

export default function Home(): JSX.Element {
  usePageTitle('home.title');
  const { t } = useTranslation();

  return (
    <UIShellContent>
      <Box sx={styles.content}>
        <UITypography component="h1" sx={styles.heading}>
          {t('home.heading')}
        </UITypography>
        <UITypography sx={styles.description}>{t('home.description')}</UITypography>
      </Box>
    </UIShellContent>
  );
}
