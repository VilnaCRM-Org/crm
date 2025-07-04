import UIButton from '@/components/UIButton';
import { Box, Divider, Grid } from '@mui/material';

import { ReactComponent as Facebook } from '../../../assets/facebookColor.svg';
import { ReactComponent as Github } from '../../../assets/github.svg';
import { ReactComponent as Google } from '../../../assets/GoogleColor.svg';
import { ReactComponent as Twitter } from '../../../assets/twitterColor.svg';

export default function ThirdPartyAuth(): JSX.Element {
  return (
    <Box>
      <Divider
        sx={{
          marginTop: '13px',
          marginBottom: '25px',
          textTransform: 'uppercase',
          lineHeight: '18px',
          fontSize: '14px',
          '@media (max-width: 1024px)': {
            fontSize: '1.125rem',
            marginTop: '23px',
            marginBottom: '18px',
          },
          '@media (max-width: 375px)': {
            marginTop: '17px',
            marginBottom: '14px',
          },
        }}
      >
        Або
      </Divider>
      <Grid container justifyContent="space-between">
        <UIButton variant="outlined">
          <Google />
        </UIButton>
        <UIButton variant="outlined">
          <Facebook />
        </UIButton>
        <UIButton variant="outlined">
          <Github />
        </UIButton>
        <UIButton variant="outlined">
          <Twitter />
        </UIButton>
      </Grid>
    </Box>
  );
}
