import Box from '@mui/material/Box';
import type { JSX } from 'react';
import { useTranslation } from 'react-i18next';
import { useOutletContext } from 'react-router';

import UIButton from '@/components/ui-button';
import UIContainer from '@/components/ui-container';
import UITypography from '@/components/ui-typography';
import usePageTitle from '@/hooks/use-page-title';
import type { ProtectedOutletContext } from '@/routes/types/protected-outlet-context';

import styles from './styles';

export default function Home(): JSX.Element {
  usePageTitle('home.title');
  const { t } = useTranslation();
  const { signOut } = useOutletContext<ProtectedOutletContext>();

  return (
    <UIContainer>
      <Box sx={styles.content}>
        <UITypography component="h1" sx={styles.heading}>
          {t('home.heading')}
        </UITypography>
        <UITypography sx={styles.description}>{t('home.description')}</UITypography>
        <UIButton variant="outlined" onClick={signOut} sx={styles.signOut}>
          {t('home.sign_out')}
        </UIButton>
      </Box>
    </UIContainer>
  );
}
