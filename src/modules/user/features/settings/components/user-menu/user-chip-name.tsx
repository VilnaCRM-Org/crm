import Box from '@mui/material/Box';
import type { JSX } from 'react';

import useChipNameGrowth from '../../hooks/use-chip-name-growth';
import type { UserChipNameProps } from '../../types/components/user-menu';

import styles from './chip-name-styles';

export default function UserChipName({ layout, name }: UserChipNameProps): JSX.Element {
  const growth = useChipNameGrowth();

  return (
    <Box component="span" sx={{ ...styles.box[layout], '--user-chip-grow': `${growth.grow}px` }}>
      <Box component="span" sx={styles.name[layout]}>
        {name}
      </Box>
      <Box component="span" ref={growth.sizers} aria-hidden="true" sx={styles.sizers[layout]}>
        <Box component="span" data-text={name} sx={styles.copy.spaced} />
        <Box component="span" data-text={name} sx={styles.copy.rest} />
      </Box>
    </Box>
  );
}
