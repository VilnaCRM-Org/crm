import { Box } from '@mui/material';
import React from 'react';

import styles from './styles';

type ContainerProps = {
  children: React.ReactNode;
};

export default function UIContainer({ children }: ContainerProps): React.ReactElement {
  return <Box sx={styles.container}>{children}</Box>;
}
