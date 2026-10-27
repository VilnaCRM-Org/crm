import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined';
import Box from '@mui/material/Box';
import type { JSX } from 'react';

import useFocusOnMount from '@/utils/use-focus-on-mount';

import type { StatusHeadingProps } from '../../types/components/two-factor-settings';

import styles from './styles';

export default function StatusHeading({ text, icon }: StatusHeadingProps): JSX.Element | null {
  const focusOnMount = useFocusOnMount<HTMLElement>();
  if (text === null) return null;

  return (
    <Box component="h3" ref={focusOnMount} tabIndex={-1} sx={styles.statusHeading}>
      {icon && <CheckCircleOutlinedIcon aria-hidden="true" sx={styles.statusIcon} />}
      {text}
    </Box>
  );
}
