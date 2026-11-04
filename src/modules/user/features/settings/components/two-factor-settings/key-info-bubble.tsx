import Box from '@mui/material/Box';
import type { JSX } from 'react';

import type { KeyInfoBubbleProps } from '../../types/components/two-factor-settings';

import styles from './key-info-styles';

export default function KeyInfoBubble({ id, open, text }: KeyInfoBubbleProps): JSX.Element {
  return (
    <Box sx={open ? styles.open : styles.closed}>
      <Box id={id} role="tooltip" sx={styles.body}>
        {text}
      </Box>
      <Box sx={styles.arrow} />
    </Box>
  );
}
