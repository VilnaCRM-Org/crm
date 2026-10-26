import Box from '@mui/material/Box';
import Fade from '@mui/material/Fade';
import type { JSX } from 'react';

import type { DrawerScrimProps } from '@/components/types/ui-navigation-drawer';

import styles from './styles';
import useFooterInset from './use-footer-inset';

export default function DrawerScrim({ duration }: DrawerScrimProps): JSX.Element {
  const bottom = useFooterInset();

  return (
    <Fade in appear timeout={duration}>
      <Box aria-hidden="true" sx={{ ...styles.scrim, bottom: `${bottom}px` }} />
    </Fade>
  );
}
