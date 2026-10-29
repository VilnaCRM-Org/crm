import Box from '@mui/material/Box';
import type { JSX } from 'react';

import type { UILinkButtonProps } from '@/components/types/ui-link-button';

import styles from './styles';

export default function UILinkButton({
  children,
  onClick,
  unavailable = false,
  describedBy,
  sx = {},
}: UILinkButtonProps): JSX.Element {
  return (
    <Box
      component="button"
      type="button"
      aria-disabled={unavailable ? 'true' : undefined}
      aria-describedby={describedBy}
      sx={[styles.button, sx]}
      onClick={unavailable ? undefined : onClick}
    >
      {children}
    </Box>
  );
}
