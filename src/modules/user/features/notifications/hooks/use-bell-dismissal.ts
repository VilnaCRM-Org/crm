import { type KeyboardEvent, useCallback } from 'react';

import type { BellDismissal, BellDismissalOptions } from '../types/bell-disclosure';

import useBellFocusOut from './use-bell-focus-out';
import useBellOutsideClose from './use-bell-outside-close';

export default function useBellDismissal({
  expanded,
  close,
  bell,
  wrapper,
}: BellDismissalOptions): BellDismissal {
  useBellOutsideClose({ expanded, close, wrapper });
  const focusOut = useBellFocusOut({ close, wrapper });

  const keyDown = useCallback(
    (event: KeyboardEvent<HTMLElement>) => {
      if (expanded && event.key === 'Escape') {
        close();
        bell.current?.focus();
      }
    },
    [expanded, close, bell]
  );

  return { keyDown, focusOut };
}
