import Box from '@mui/material/Box';
import type { JSX } from 'react';

import type { HeaderHiddenTextProps } from '@/components/types/ui-app-header';

import styles from './styles';

export default function HeaderHiddenText({ id, children }: HeaderHiddenTextProps): JSX.Element {
  return (
    <Box component="span" id={id} sx={styles.hidden}>
      {children}
    </Box>
  );
}
