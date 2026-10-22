import Box from '@mui/material/Box';
import type { JSX } from 'react';

import type { UILinkButtonProps } from '@/components/types/ui-link-button';

import styles from './styles';

export default function UILinkButton({
  children,
  onClick,
  unavailable = false,
  sx = {},
}: UILinkButtonProps): JSX.Element {
  return (
    <Box
      component="button"
      type="button"
      aria-disabled={unavailable ? 'true' : undefined}
      sx={[styles.button, sx]}
      onClick={unavailable ? undefined : onClick}
    >
      {children}
    </Box>
  );
}
