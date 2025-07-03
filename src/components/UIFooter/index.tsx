import { Box } from '@mui/material';
import * as React from 'react';

import UIContainer from '@/components/UIContainer';
import UIFooterMobile from '@/components/UIFooter/Mobile/UIFooterMobile';
import UIFooterStandard from '@/components/UIFooter/Standard/UIFooterStandard';

import Styles from './styles';

export default function UIFooter(): React.ReactElement {
  return (
    <Box component='section' sx={Styles.footerSection}>
      <UIContainer>
          <UIFooterMobile />
      </UIContainer>

      <Box sx={Styles.uiStandard}>
        <UIFooterStandard />
      </Box>
    </Box>
  );
}
