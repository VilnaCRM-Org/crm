import Box from '@mui/material/Box';
import SvgIcon from '@mui/material/SvgIcon';
import type { JSX } from 'react';

import type { SocialTileLabelProps } from '../../types/components/social-networks';

import styles from './styles';

export default function TileLabel({ tile, status }: SocialTileLabelProps): JSX.Element {
  return (
    <>
      <SvgIcon component={tile.Icon} inheritViewBox sx={styles.icon} />
      <Box component="span" sx={styles.label}>
        {tile.label}
        <Box component="span" sx={styles.status}>
          {status}
        </Box>
      </Box>
    </>
  );
}
