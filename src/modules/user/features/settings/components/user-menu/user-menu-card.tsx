import Box from '@mui/material/Box';
import type { JSX } from 'react';

import type { UserMenuCardProps } from '../../types/components/user-menu';

import styles from './styles';

export default function UserMenuCard({
  layout,
  open,
  chip,
  items,
}: UserMenuCardProps): JSX.Element {
  if (layout === 'mobile') {
    return (
      <>
        {chip}
        {open && (
          <Box sx={styles.popover}>
            <Box sx={styles.popoverCaret} />
            <Box sx={styles.popoverBody}>{items}</Box>
          </Box>
        )}
      </>
    );
  }

  return (
    <Box sx={{ ...styles.card[layout], ...(open ? styles.card.open : {}) }}>
      {chip}
      {open && items}
    </Box>
  );
}
