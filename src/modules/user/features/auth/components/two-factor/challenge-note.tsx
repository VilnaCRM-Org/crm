import { Box } from '@mui/material';
import type { JSX } from 'react';

import type { ChallengeNoteProps } from '@auth/types/two-factor/challenge-components';

import styles from './styles';

export default function ChallengeNote({ text }: ChallengeNoteProps): JSX.Element {
  return (
    <Box component="p" sx={styles.note}>
      {text}
    </Box>
  );
}
