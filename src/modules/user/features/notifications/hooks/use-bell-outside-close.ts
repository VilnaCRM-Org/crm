import { useCallback } from 'react';

import type { BellOutsideCloseOptions } from '../types/bell-disclosure';

import useDocumentEvent from './use-document-event';

export default function useBellOutsideClose({
  expanded,
  close,
  wrapper,
}: BellOutsideCloseOptions): void {
  const listener = useCallback(
    (event: Event): void => {
      const inside = wrapper.current !== null && event.composedPath().includes(wrapper.current);
      if (!inside) close();
    },
    [close, wrapper]
  );
  useDocumentEvent({ active: expanded, type: 'pointerdown', listener, capture: true });
  useDocumentEvent({ active: expanded, type: 'focusin', listener, capture: false });
}
