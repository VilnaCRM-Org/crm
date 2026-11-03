import Box from '@mui/material/Box';
import type { ClipboardEvent, JSX } from 'react';

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
  const onCopy = (event: ClipboardEvent<HTMLElement>): void => {
    event.clipboardData.setData('text/plain', secret);
    event.preventDefault();
  };

  return (
    <Box component="code" ref={chipRef} onCopy={onCopy} sx={styles.keyChip}>
      {groupsOf(secret)}
    </Box>
  );
}
