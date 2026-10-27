import Box from '@mui/material/Box';
import type { JSX } from 'react';

import type { UIShellContentProps } from '@/components/types/ui-shell-content';

import styles from './styles';

export default function UIShellContent({ children }: UIShellContentProps): JSX.Element {
  return <Box sx={styles.container}>{children}</Box>;
}
