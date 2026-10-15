import { type FocusEvent, useLayoutEffect, useRef } from 'react';

import type { FocusReturnHandlers, FocusReturnTarget } from '@/components/types/ui-form';

function restoreFocus(heldFocus: boolean, target: FocusReturnTarget): void {
  if (heldFocus && document.activeElement === document.body) target.current?.focus();
}

export default function useFocusReturn(
  shown: boolean,
  returnFocusRef: FocusReturnTarget
): FocusReturnHandlers {
  const heldFocus = useRef(false);
  const hold = (value: boolean): void => {
    heldFocus.current = value;
  };

  useLayoutEffect(() => {
    if (shown) return;
    restoreFocus(heldFocus.current, returnFocusRef);
    heldFocus.current = false;
  }, [shown, returnFocusRef]);

  return {
    onFocus: (): void => hold(true),
    onBlur: (event: FocusEvent<HTMLElement>): void =>
      hold(heldFocus.current && !event.relatedTarget),
  };
}
