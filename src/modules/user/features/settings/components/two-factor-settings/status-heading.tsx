import Box from '@mui/material/Box';
import type { JSX } from 'react';

import useOptionalFocus from '../../hooks/use-optional-focus';
import type { StatusHeadingProps } from '../../types/components/two-factor-settings';

import styles from './styles';

export default function StatusHeading({ text, focus }: StatusHeadingProps): JSX.Element | null {
  const focusOnMount = useOptionalFocus<HTMLElement>(focus);
  if (text === null) return null;

  return (
    <Box component="h3" ref={focusOnMount} tabIndex={-1} sx={styles.statusHeading}>
      {text}
    </Box>
  );
}
