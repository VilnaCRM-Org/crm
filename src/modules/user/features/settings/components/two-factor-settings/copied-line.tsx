import Box from '@mui/material/Box';
import useMediaQuery from '@mui/material/useMediaQuery';
import { type JSX, useState } from 'react';

import type { CopiedLineProps } from '../../types/components/two-factor-settings';

import styles from './copy-line-styles';
import copyLineTiming from './copy-line-timing';

export default function CopiedLine({ text }: CopiedLineProps): JSX.Element | null {
  const reduceMotion = useMediaQuery('(prefers-reduced-motion: reduce)');
  const [expired, setExpired] = useState(false);
  const [holdLine] = useState(() => (): (() => void) => {
    const fadeMs = reduceMotion ? 0 : copyLineTiming.fadeMs;
    const timer = setTimeout(() => setExpired(true), copyLineTiming.holdMs + fadeMs);
    return () => clearTimeout(timer);
  });

  return expired ? null : (
    <Box component="p" ref={holdLine} aria-hidden="true" sx={styles.copiedLine}>
      {text}
    </Box>
  );
}
