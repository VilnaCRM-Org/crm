import Box from '@mui/material/Box';
import type { JSX } from 'react';

import type { CopyLabelProps } from '../../types/components/two-factor-settings';

import styles from './copy-line-styles';

export default function CopyLabel({ label, copiedText, copied }: CopyLabelProps): JSX.Element {
  return (
    <Box component="span" sx={styles.label}>
      <Box component="span" aria-hidden={copied} sx={styles.text[copied ? 'hidden' : 'shown']}>
        {label}
      </Box>
      <Box component="span" aria-hidden={!copied} sx={styles.text[copied ? 'shown' : 'hidden']}>
        {copiedText}
      </Box>
    </Box>
  );
}
