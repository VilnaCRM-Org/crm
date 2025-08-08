import { Box, Grid, SvgIcon } from '@mui/material';
import * as React from 'react';
import { useTranslation } from 'react-i18next';

import UILink from '@/components/UILink';
import UITypography from '@/components/UITypography';

import { ReactComponent as VilnaLogo } from '../../../assets/icons/logo/vilna-logo.svg';
import SocialMedia from '../SocialMedia/socialMedia';

import styles from './styles';

export default function UIFooterContent(): React.ReactElement {
  const { t } = useTranslation();

  return (
    <Box sx={styles.footerDesktopWrapper}>
      <Box sx={styles.footerBranding}>
        <SvgIcon component={VilnaLogo} inheritViewBox sx={styles.footerLogo} />

        <SocialMedia />
      </Box>

      <Grid item sx={styles.uiInfoWrapper}>
        <UILink href="mailto:info@vilnacrm.com" sx={styles.uiEmailLink}>
          {t('footer.vilna_email')}
        </UILink>

        <UILink href="#" sx={styles.uiLinkTypography}>
          <UITypography>{t('footer.privacy')}</UITypography>
        </UILink>

        <UILink href="#" sx={styles.uiLinkTypography}>
          <UITypography>{t('footer.usage_policy')}</UITypography>
        </UILink>

        <UITypography sx={styles.uiCopyrightTypography}>{t('footer.copyright')} 2022</UITypography>
      </Grid>
    </Box>
  );
}
