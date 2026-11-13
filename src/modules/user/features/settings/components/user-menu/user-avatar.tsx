import PersonOutlinedIcon from '@mui/icons-material/PersonOutlined';
import Box from '@mui/material/Box';
import type { JSX } from 'react';

import type { UserAvatarProps } from '../../types/components/user-menu';

import styles from './styles';

export default function UserAvatar({ monogram, size }: UserAvatarProps): JSX.Element {
  const drawsGlyph = monogram === '';

  return (
    <Box
      aria-hidden="true"
      data-monogram={drawsGlyph ? undefined : monogram}
      sx={{ ...styles.avatar.base, ...styles.avatar.sizes[size] }}
    >
      {drawsGlyph && <PersonOutlinedIcon sx={styles.glyph[size]} />}
    </Box>
  );
}
