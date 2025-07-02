import { Grid, Box } from '@mui/material';
import * as React from 'react';

import UILink from '@/components/UILink';
import UITypography from '@/components/UITypography';

import VilnaLogo from '../../../assets/icons/VilnaLogo.svg';
import SocialMedia from '../SocialMedia/socialMedia';

import Styles from './styles';

export default function UIFooterMobile(): React.ReactElement {
  return (
    <Box>
      <Grid container direction="row" justifyContent="space-between" sx={Styles.uiGridTop}>
        <Grid container justifyContent="space-between" item sx={Styles.uiLogoContainer}>
          <Grid item sx={Styles.uiLogo}>
            <img src={VilnaLogo} alt="test" />
          </Grid>
          <Grid item sx={Styles.uiSocialLinks}>
            <SocialMedia />
          </Grid>
        </Grid>
        <Grid container item sx={Styles.uiPolicyContainer}>
          <Grid item sx={Styles.uiSocialLinksContainer}>
            <UILink href="mailto:info@vilnacrm.com">
              <UITypography sx={Styles.uiEmail}>info@vilnacrm.com</UITypography>
            </UILink>
          </Grid>
          <Grid item sx={Styles.uiPolicyItem}>
            <UILink href="#">
              <UITypography variant="steelGray" sx={Styles.uiLinkTypography}>
                Політика конфіденційності
              </UITypography>
            </UILink>
          </Grid>
          <Grid item sx={Styles.uiPolicyItem}>
            <UILink href="#">
              <UITypography variant="steelGray" sx={Styles.uiLinkTypography}>
                Політика використовування
              </UITypography>
            </UILink>
          </Grid>
          <Grid item sx={Styles.uiCopyrightContainer}>
            <UITypography sx={Styles.uiCopyrightTypography}>
              Copyright © ТОВ “Вільна СРМ”, 2022
            </UITypography>
          </Grid>
        </Grid>
      </Grid>
    </Box>
  );
}
