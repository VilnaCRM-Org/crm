import { type RefObject, useLayoutEffect } from 'react';

import type { ToastItemSet } from '@/components/types/ui-toast';

function revealFocused(stack: HTMLElement, top: number): void {
  const focused = document.activeElement ?? document.body;
  const outside = focused !== document.body && !stack.contains(focused);
  if (outside && focused.getBoundingClientRect().bottom > top) {
    focused.scrollIntoView({ block: 'nearest' });
  }
}

function reserveClearance(stack: HTMLElement): () => void {
  const root = document.documentElement;
  const page = document.body;
  const reserve = (): void => {
    const { top } = stack.getBoundingClientRect();
    const clearance = `${window.innerHeight - top}px`;
    root.style.setProperty('scroll-padding-bottom', clearance);
    page.style.setProperty('padding-bottom', clearance);
    revealFocused(stack, top);
  };
  reserve();
  window.addEventListener('resize', reserve);
  return (): void => {
    window.removeEventListener('resize', reserve);
    root.style.removeProperty('scroll-padding-bottom');
    page.style.removeProperty('padding-bottom');
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
