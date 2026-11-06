import PersonOutlinedIcon from '@mui/icons-material/PersonOutlined';
import Box from '@mui/material/Box';
import type { JSX } from 'react';

import { ReactComponent as BellIcon } from '@/assets/icons/shell/bell-01.svg';
import { ReactComponent as TasksIcon } from '@/assets/icons/shell/dotpoints-01.svg';
import type { DrawerHeaderCopiesProps } from '@/components/types/ui-navigation-drawer';

import styles from './styles';

export default function DrawerHeaderCopies({ avatar }: DrawerHeaderCopiesProps): JSX.Element {
  return (
    <>
      <Box component={BellIcon} aria-hidden="true" focusable="false" sx={styles.glyph} />
      <Box component={TasksIcon} aria-hidden="true" focusable="false" sx={styles.glyph} />
      <Box aria-hidden="true" sx={styles.avatar}>
        {avatar ?? <PersonOutlinedIcon sx={styles.avatarGlyph} />}
      </Box>
    </>
  );
}
