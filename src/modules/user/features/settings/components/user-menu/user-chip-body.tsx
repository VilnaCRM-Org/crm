import Box from '@mui/material/Box';
import type { JSX } from 'react';

import { ReactComponent as CaretIcon } from '@/assets/icons/shell/chevron-left.svg';

import type { UserChipBodyProps } from '../../types/components/user-menu';

import styles from './styles';
import UserAvatar from './user-avatar';
import UserChipName from './user-chip-name';

export default function UserChipBody({ layout, identity }: UserChipBodyProps): JSX.Element {
  return (
    <>
      <Box sx={{ position: 'absolute', ...styles.avatar.chip[layout] }}>
        <UserAvatar monogram={identity?.monogram ?? ''} size="chip" />
      </Box>
      <UserChipName layout={layout} name={identity?.displayName} />
      <Box component={CaretIcon} aria-hidden="true" focusable="false" sx={styles.caret[layout]} />
    </>
  );
}
