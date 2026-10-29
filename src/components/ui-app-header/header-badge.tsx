import Box from '@mui/material/Box';
import type { JSX } from 'react';

import type { HeaderBadgeProps } from '@/components/types/ui-app-header/shell-badge-counts';

import badgeCountGuard from './badge-count-guard';
import styles from './styles';

const BADGE_MAX = 99;

export default function HeaderBadge({ count }: HeaderBadgeProps): JSX.Element | null {
  if (!badgeCountGuard.shows(count)) return null;

  const value = Number(count);

  return (
    <Box component="span" aria-hidden="true" sx={styles.badge}>
      {value > BADGE_MAX ? `${BADGE_MAX}+` : value}
    </Box>
  );
}
