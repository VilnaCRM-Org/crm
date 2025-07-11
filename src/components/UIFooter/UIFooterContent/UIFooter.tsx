import { Box, Grid } from '@mui/material';
import * as React from 'react';

import UILink from '@/components/UILink';
import UITypography from '@/components/UITypography';

import VilnaLogo from '../../../assets/icons/VilnaLogo.svg';
import SocialMedia from '../SocialMedia/socialMedia';

import styles from './styles';

export default function UIFooterContent(): React.ReactElement {
  return (
    <Box sx={styles.footerDesktopWrapper}>
      <Box sx={styles.footerBranding}>
        <img src={VilnaLogo} width={131} height={44} alt="logo" />
        <SocialMedia />
      </Box>

      <Grid item sx={styles.uiInfoWrapper}>
        <UILink href="mailto:info@vilnacrm.com" sx={styles.uiEmailLink}>
          info@vilnacrm.com
        </UILink>

        <UILink href="#" sx={styles.uiLinkTypography}>
          <UITypography variant="steelGray">Політика конфіденційності</UITypography>
        </UILink>

        <UILink href="#" sx={styles.uiLinkTypography}>
          <UITypography variant="steelGray">Політика використовування</UITypography>
        </UILink>

        <UITypography sx={styles.uiCopyrightTypography}>
          Copyright © ТОВ “Вільна СРМ”, 2022
        </UITypography>
      </Grid>
    </Box>
  );
}
