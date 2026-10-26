import Box from '@mui/material/Box';
import type { JSX } from 'react';

import { ReactComponent as CaretIcon } from '@/assets/icons/shell/chevron-left.svg';

import type { UserChipBodyProps } from '../../types/components/user-menu';

import styles from './styles';
import UserAvatar from './user-avatar';

export default function UserChipBody({ layout, identity }: UserChipBodyProps): JSX.Element {
  return (
    <>
      <Box sx={{ position: 'absolute', ...styles.avatar.chip[layout] }}>
        <UserAvatar monogram={identity?.monogram ?? ''} size="chip" />
      </Box>
      <Box component="span" sx={styles.name[layout]}>
        {identity?.displayName}
      </Box>
      <Box component={CaretIcon} aria-hidden="true" focusable="false" sx={styles.caret[layout]} />
    </>
  );
}
