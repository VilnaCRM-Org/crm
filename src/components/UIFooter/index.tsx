import { Grid, Box } from '@mui/material';
import * as React from 'react';

import './styles.scss';

import UILink from '@/components/UILink';
import UITypography from '@/components/UITypography';

import { ReactComponent as VilnaLogo } from '../../assets/icons/VilnaLogo.svg';

import SocialMedia from './socialMedia';

export default function UIFooter(): React.ReactElement {
  return (
    <Box>
      <Grid container direction="row" justifyContent="space-between" className='ui-grid-top'>
        <Grid container item className='ui-logo-container'>
          <Grid item>
            <VilnaLogo />
          </Grid>
        </Grid>
        <Grid container item className='ui-policy-container'>
          <Grid item className='ui-policy-item'>
            <UILink href="#">
              <UITypography className='ui-link-typography' variant='steelGray'>
                Політика конфіденційності
              </UITypography>
            </UILink>
          </Grid>
          <Grid item className='ui-policy-item'>
            <UILink href="#">
              <UITypography className='ui-link-typography' variant='steelGray'>
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
          className='ui-grid-bottom'
        >
          <Grid item className='ui-copyright-container'>
            <UITypography className='ui-copyright-typography'>Copyright © ТОВ “Вільна СРМ”, 2022</UITypography>
          </Grid>
          <Grid
            container
            item
            direction="row"
            className='ui-social-links-container'
          >
            <UILink href="mailto:info@vilnacrm.com" className='ui-email-link'>
              <UITypography>info@vilnacrm.com</UITypography>
            </UILink>
            <SocialMedia/>
          </Grid>
        </Grid>
      </Grid>
    </Box>
  );
}
