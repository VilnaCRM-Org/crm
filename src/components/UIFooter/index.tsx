import { Box } from '@mui/material';
import * as React from 'react';

import UIFooterMobile from '@/components/UIFooter/Mobile/UIFooterMobile';
import UIFooterStandard from '@/components/UIFooter/Standard/UIFooterStandard';

import Styles from './styles';

export default function UIFooter(): React.ReactElement {
  return (
    <>
      <Box sx={Styles.uiStandard}>
        <UIFooterStandard />
      </Box>
      <Box sx={Styles.uiMobile}>
        <UIFooterMobile />
      </Box>
    </>
  );
}
