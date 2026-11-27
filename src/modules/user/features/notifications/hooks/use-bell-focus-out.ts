import { type FocusEvent, type FocusEventHandler, useCallback } from 'react';

import type { BellFocusOutOptions } from '../types/bell-disclosure';

export default function useBellFocusOut({
  close,
  wrapper,
}: BellFocusOutOptions): FocusEventHandler<HTMLElement> {
  return useCallback(
    (event: FocusEvent<HTMLElement>) => {
      if (event.relatedTarget !== null && !wrapper.current?.contains(event.relatedTarget)) close();
    },
    [close, wrapper]
  );
}
