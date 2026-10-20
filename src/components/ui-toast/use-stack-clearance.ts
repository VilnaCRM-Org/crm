import { type RefObject, useLayoutEffect } from 'react';

import type { ToastItemSet } from '@/components/types/ui-toast';

function reserveClearance(stack: HTMLElement): () => void {
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
}

export default function useStackClearance(
  stackRef: RefObject<HTMLElement | null>,
  toasts: ToastItemSet
): void {
  useLayoutEffect(() => {
    const stack = stackRef.current;
    return stack === null ? undefined : reserveClearance(stack);
  }, [toasts, stackRef]);
}
