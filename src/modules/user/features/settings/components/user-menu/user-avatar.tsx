import PersonOutlinedIcon from '@mui/icons-material/PersonOutlined';
import Box from '@mui/material/Box';
import type { JSX } from 'react';

import type { UserAvatarProps } from '../../types/components/user-menu';

import styles from './styles';

export default function UserAvatar({ monogram, size }: UserAvatarProps): JSX.Element {
  return (
    <Box aria-hidden="true" sx={{ ...styles.avatar.base, ...styles.avatar.sizes[size] }}>
      {monogram === '' ? <PersonOutlinedIcon sx={styles.glyph[size]} /> : monogram}
    </Box>
  );
}
