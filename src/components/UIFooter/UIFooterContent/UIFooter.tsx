import { Box, Grid, SvgIcon } from '@mui/material';
import * as React from 'react';
import { useTranslation } from 'react-i18next';

import UILink from '@/components/UILink';
import UITypography from '@/components/UITypography';

import { ReactComponent as VilnaLogo } from '../../../assets/icons/logo/vilna-logo.svg';

import styles from './styles';

export default function UIFooterContent(): React.ReactElement {
  const { t } = useTranslation();

  return (
    <Box sx={styles.footerDesktopWrapper}>
      <SvgIcon component={VilnaLogo} inheritViewBox sx={styles.footerLogo} />

      <Grid item sx={styles.uiInfoWrapper}>
        <UILink href="#" sx={styles.uiLinkTypography}>
          <UITypography>{t('footer.privacy')}</UITypography>
        </UILink>

        <UILink href="#" sx={styles.uiLinkTypography}>
          <UITypography>{t('footer.usage_policy')}</UITypography>
        </UILink>
      </Grid>
    </Box>
  );
}
