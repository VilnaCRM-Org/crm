import { Box } from '@mui/material';
import * as React from 'react';

import UIContainer from '@/components/UIContainer';

import Styles from './styles';
import UIFooterContent from './UIFooterContent/UIFooter';

export default function UIFooter(): React.ReactElement {
  return (
    <Box component="section" sx={Styles.footerSection}>
      <UIContainer>
        <UIFooterContent />
      </UIContainer>
    </Box>
  );
}
