import Box from '@mui/material/Box';
import type { JSX } from 'react';

import type { KeyChipProps } from '../../types/components/two-factor-settings';

import styles from './styles';

const GROUP_SIZE = 4;

function groupsOf(secret: string): string {
  const groups: string[] = [];
  for (let start = 0; start < secret.length; start += GROUP_SIZE) {
    groups.push(secret.slice(start, start + GROUP_SIZE));
  }
  return groups.join(' ');
}

export default function KeyChip({ secret, chipRef }: KeyChipProps): JSX.Element {
  return (
    <Box component="code" ref={chipRef} sx={styles.keyChip}>
      {groupsOf(secret)}
    </Box>
  );
}
