import { type RefObject, useCallback } from 'react';

import type { BellDismissalOptions } from '../types/bell-disclosure';

import useDocumentEvent from './use-document-event';

function concernsPanel(target: Node, wrapper: RefObject<HTMLDivElement | null>): boolean {
  const { body, documentElement } = document;

  return target === body || target === documentElement || !!wrapper.current?.contains(target);
}

export default function useBellEscape({
  expanded,
  close,
  bell,
  wrapper,
}: BellDismissalOptions): void {
  const listener = useCallback(
    (event: KeyboardEvent): void => {
      if (event.key !== 'Escape' || !concernsPanel(event.target as Node, wrapper)) return;
      close();
      bell.current?.focus();
    },
    [close, bell, wrapper]
  );
  useDocumentEvent({ active: expanded, type: 'keydown', listener, capture: false });
}
