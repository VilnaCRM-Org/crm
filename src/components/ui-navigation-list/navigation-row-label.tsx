import Box from '@mui/material/Box';
import type { JSX } from 'react';

import type { NavigationRowLabelProps } from '@/components/types/ui-navigation-list';

import styles from './styles';

export default function NavigationRowLabel({
  layout,
  variant,
  label,
  grouped,
}: NavigationRowLabelProps): JSX.Element {
  if (variant === 'rail') {
    return (
      <Box component="span" sx={styles.hidden}>
        {label}
      </Box>
    );
  }

  return grouped ? (
    <Box component="span" sx={styles.groupLabel[layout]}>
      {label}
    </Box>
  ) : (
    <>{label}</>
  );
}
