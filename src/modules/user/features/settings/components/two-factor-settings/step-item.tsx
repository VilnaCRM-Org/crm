import Box from '@mui/material/Box';
import type { JSX } from 'react';

import type { StepItemProps } from '../../types/components/two-factor-settings';

import styles from './setup-steps-styles';

export default function StepItem({
  position,
  text,
  textSx = styles.stepText,
  rowSx = styles.stepRow,
  action = null,
  children = null,
}: StepItemProps): JSX.Element {
  return (
    <Box component="li" sx={styles.step}>
      <Box sx={rowSx}>
        <Box component="span" aria-hidden="true" sx={styles.badge}>
          {position}
        </Box>
        <Box component="p" sx={textSx}>
          {text}
        </Box>
        {action}
      </Box>
      {children !== null && <Box sx={styles.stepBody}>{children}</Box>}
    </Box>
  );
}
