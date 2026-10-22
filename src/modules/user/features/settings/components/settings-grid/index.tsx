import Box from '@mui/material/Box';
import type { JSX } from 'react';

import type { SettingsGridProps } from '../../types/components/settings-grid';

import styles from './styles';

export default function SettingsGrid({ children }: SettingsGridProps): JSX.Element {
  return <Box sx={styles.grid}>{children}</Box>;
}
