import Box from '@mui/material/Box';
import { type JSX, Suspense } from 'react';

import type { UserSlotFrameProps } from '@/components/types/ui-app-header';

import styles from './styles';

function SlotPlaceholder(): JSX.Element {
  return <Box aria-hidden="true" sx={styles.slotPlaceholder} />;
}

export default function UserSlotFrame({ layout, children }: UserSlotFrameProps): JSX.Element {
  return (
    <Box sx={styles.slot[layout]}>
      <Suspense fallback={<SlotPlaceholder />}>{children ?? <SlotPlaceholder />}</Suspense>
    </Box>
  );
}
