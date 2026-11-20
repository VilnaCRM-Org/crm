import useMediaQuery from '@mui/material/useMediaQuery';
import { type RefObject, useLayoutEffect } from 'react';

import type { NotificationViewSet } from '@/lib/notifications/types/notification-view';

export default function useInlineReveal(
  blockRef: RefObject<HTMLElement | null>,
  batch: NotificationViewSet
): void {
  const reduced = useMediaQuery('(prefers-reduced-motion: reduce)');

  useLayoutEffect(() => {
    const block = blockRef.current;
    if (block === null) {
      return;
    }
    const { top, bottom } = block.getBoundingClientRect();
    if (top >= 0 && bottom <= window.innerHeight) {
      return;
    }
    block.scrollIntoView({ block: 'nearest', behavior: reduced ? 'auto' : 'smooth' });
  }, [blockRef, batch, reduced]);
}
