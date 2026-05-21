import { Box } from '@mui/material';
import * as React from 'react';

import UIContainer from '@/components/ui-container';

import Styles from './styles';
import UIFooterContent from './ui-footer-content/ui-footer';

export default function UIFooter(): React.ReactElement {
  return (
    <Box component="footer" sx={Styles.footerSection}>
      <UIContainer>
        <UIFooterContent />
      </UIContainer>
    </Box>
  );
}
