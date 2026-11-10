import Box from '@mui/material/Box';
import type { JSX } from 'react';

import useChipLabel from '../../hooks/use-chip-label';
import type { UserChipProps } from '../../types/components/user-menu';

import styles from './styles';
import UserAvatar from './user-avatar';
import UserChipBody from './user-chip-body';

export default function UserChip({ layout, identity, menu, menuId }: UserChipProps): JSX.Element {
  return (
    <Box
      component="button"
      type="button"
      ref={menu.chip}
      aria-haspopup="menu"
      aria-expanded={menu.open}
      aria-controls={menu.open ? menuId : undefined}
      aria-label={useChipLabel(identity)}
      onClick={menu.open ? menu.dismiss : menu.show}
      onKeyDown={menu.chipKeyDown}
      sx={styles.chip[layout]}
    >
      {layout === 'mobile' ? (
        <UserAvatar monogram={identity?.monogram ?? ''} size="avatar" />
      ) : (
        <UserChipBody layout={layout} identity={identity} />
      )}
    </Box>
  );
}
