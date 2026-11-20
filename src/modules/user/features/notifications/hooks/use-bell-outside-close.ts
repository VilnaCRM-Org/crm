import { useEffect } from 'react';

import type { BellOutsideCloseOptions } from '../types/bell-disclosure';

export default function useBellOutsideClose({
  expanded,
  close,
  wrapper,
}: BellOutsideCloseOptions): void {
  useEffect(() => {
    if (!expanded) return undefined;
    const outside = (event: PointerEvent): void => {
      const inside = wrapper.current !== null && event.composedPath().includes(wrapper.current);
      if (!inside) close();
    };
    document.addEventListener('pointerdown', outside, true);

    return (): void => document.removeEventListener('pointerdown', outside, true);
  }, [expanded, close, wrapper]);
}
