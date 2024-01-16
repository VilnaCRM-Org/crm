import { Grid, Box } from '@mui/material';
import * as React from 'react';

import UILink from '@/components/UILink';
import UITypography from '@/components/UITypography';

import VilnaLogo from '../../../assets/icons/VilnaLogo.svg';
import SocialMedia from '../SocialMedia/socialMedia';

import Styles from './styles';

export default function UIFooterStandard(): React.ReactElement {
  return (
    <Box>
      <Grid container direction="row" justifyContent="space-between" sx={Styles.uiGridTop}>
        <Grid container item sx={Styles.uiLogoContainer}>
          <Grid item>
            <img src={VilnaLogo} alt='test' />
          </Grid>
        </Grid>
        <Grid container item sx={Styles.uiPolicyContainer}>
          <Grid item sx={Styles.uiPolicyItem}>
            <UILink href="#">
              <UITypography sx={Styles.uiLinkTypography} variant='steelGray'>
                Політика конфіденційності
              </UITypography>
            </UILink>
          </Grid>
          <Grid item sx={Styles.uiPolicyItem}>
            <UILink href="#">
              <UITypography sx={Styles.uiLinkTypography} variant='steelGray'>
                Політика використовування
              </UITypography>
            </UILink>
          </Grid>
        </Grid>
      </Grid>
      <Grid container>
        <Grid
          container
          direction="row"
          justifyContent="space-between"
          item
          sx={Styles.uiGridBottom}
        >
          <Grid item sx={Styles.uiCopyrightContainer}>
            <UITypography sx={Styles.uiCopyrightTypography}>Copyright © ТОВ “Вільна СРМ”, 2022</UITypography>
          </Grid>
          <Grid
            container
            item
            direction="row"
            sx={Styles.uiSocialLinksContainer}
          >
            <UILink href="mailto:info@vilnacrm.com" sx={Styles.uiEmailLink}>
              <UITypography>info@vilnacrm.com</UITypography>
            </UILink>
            <SocialMedia/>
          </Grid>
        </Grid>
      </Grid>
    </Box>
  );
}
