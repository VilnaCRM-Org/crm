import { type RefObject, useLayoutEffect } from 'react';

import type { ToastItemSet } from '@/components/types/ui-toast';

export default function useStackClearance(
  stackRef: RefObject<HTMLElement | null>,
  toasts: ToastItemSet
): void {
  useLayoutEffect(() => {
    const stack = stackRef.current;
    if (stack === null) return undefined;
    const root = document.documentElement;
    const reserve = (): void => {
      root.style.setProperty('scroll-padding-bottom', `${stack.getBoundingClientRect().height}px`);
    };
    reserve();
    window.addEventListener('resize', reserve);
    return (): void => {
      window.removeEventListener('resize', reserve);
      root.style.removeProperty('scroll-padding-bottom');
    };
  }, [toasts, stackRef]);
}
