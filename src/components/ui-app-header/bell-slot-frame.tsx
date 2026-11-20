import Box from '@mui/material/Box';
import { type JSX, Suspense } from 'react';

import type { BellSlotFrameProps } from '@/components/types/ui-app-header';

import bellStyles from './bell-styles';
import styles from './styles';

function BellPlaceholder(): JSX.Element {
  return <Box aria-hidden="true" sx={styles.slotPlaceholder} />;
}

export default function BellSlotFrame({ layout, children }: BellSlotFrameProps): JSX.Element {
  return (
    <Box sx={bellStyles.slot[layout]}>
      <Suspense fallback={<BellPlaceholder />}>{children ?? <BellPlaceholder />}</Suspense>
    </Box>
  );
}
