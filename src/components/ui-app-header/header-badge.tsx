import Box from '@mui/material/Box';
import type { JSX } from 'react';

import type { HeaderBadgeProps } from '@/components/types/ui-app-header/shell-badge-counts';

import badgeCountGuard from './badge-count-guard';
import styles from './styles';

export default function HeaderBadge({ count }: HeaderBadgeProps): JSX.Element | null {
  if (!badgeCountGuard.shows(count)) return null;

  return (
    <Box component="span" aria-hidden="true" sx={styles.badge}>
      {count}
    </Box>
  );
}
