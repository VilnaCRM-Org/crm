import Box from '@mui/material/Box';
import type { JSX } from 'react';

import type { StepItemProps } from '../../types/components/two-factor-settings';

import styles from './styles';

export default function StepItem({ position, text }: StepItemProps): JSX.Element {
  return (
    <Box component="li" sx={styles.step}>
      <Box component="span" aria-hidden="true" sx={styles.badge}>
        {position}
      </Box>
      <Box component="p" sx={styles.stepText}>
        {text}
      </Box>
    </Box>
  );
}
