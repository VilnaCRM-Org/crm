import Box from '@mui/material/Box';
import { type JSX, Suspense } from 'react';

import RouteFallback from '@/components/route-fallback';
import type { UINotificationHistoryFrameProps } from '@/components/types/ui-notification-history';

import styles from './frame-styles';

export default function UINotificationHistoryFrame({
  id,
  open,
  children,
}: UINotificationHistoryFrameProps): JSX.Element {
  return (
    <Box id={id} hidden={!open} sx={styles.frame}>
      <Box sx={styles.scroller}>
        <Suspense fallback={<RouteFallback minHeight="8rem" />}>{children}</Suspense>
      </Box>
    </Box>
  );
}
