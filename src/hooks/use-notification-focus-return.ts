import { type RefObject, useCallback } from 'react';

import useNotificationFocus from './use-notification-focus';

function usable(element: HTMLElement | null | undefined): HTMLElement | undefined {
  return element?.isConnected && !element.matches(':disabled') ? element : undefined;
}

export default function useNotificationFocusReturn(
  lastResort: RefObject<HTMLElement | null>
): () => void {
  const focus = useNotificationFocus();

  return useCallback((): void => {
    const target =
      usable(focus?.primary.current) ??
      usable(focus?.fallback?.current) ??
      usable(lastResort.current);
    target?.focus();
  }, [focus, lastResort]);
}
