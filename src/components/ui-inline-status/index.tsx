import Box from '@mui/material/Box';
import { type JSX, useRef } from 'react';

import type { UIInlineStatusProps } from '@/components/types/ui-inline-status';
import UINotificationContent from '@/components/ui-notification-content';

import styles from './styles';
import useInlineReveal from './use-inline-reveal';

export default function UIInlineStatus({
  views,
  placement = 'actions',
}: UIInlineStatusProps): JSX.Element | null {
  const blockRef = useRef<HTMLDivElement>(null);
  useInlineReveal(blockRef, views);

  if (views.items.length === 0) {
    return null;
  }
  const tone = views.items.some(({ kind }) => kind === 'error') ? 'error' : 'success';

  return (
    <Box ref={blockRef} sx={[styles.block, styles.placements[placement], styles.tones[tone]]}>
      <Box component="ul" sx={styles.list}>
        {views.items.map((view) => (
          <li key={view.id}>
            <UINotificationContent view={view} size="inline" />
          </li>
        ))}
      </Box>
    </Box>
  );
}
