import { Box } from '@mui/material';
import React from 'react';

import type { ContainerProps } from '@/components/types/ui-container';

import styles from './styles';

export default function UIContainer({ children }: ContainerProps): React.ReactElement {
  return (
    <Box sx={styles.container} aria-label="container">
      {children}
    </Box>
  );
}
