import { type RefObject, useLayoutEffect } from 'react';

import type { ToastItemSet } from '@/components/types/ui-toast';

function revealFocused(stack: HTMLElement, top: number): void {
  const focused = document.activeElement ?? document.body;
  const outside = focused !== document.body && !stack.contains(focused);
  if (outside && focused.getBoundingClientRect().bottom > top) {
    focused.scrollIntoView({ block: 'nearest' });
  }
}

function setClearance(value: string): void {
  document.documentElement.style.setProperty('scroll-padding-bottom', value);
  document.body.style.setProperty('padding-bottom', value);
}

function clearClearance(): void {
  document.documentElement.style.removeProperty('scroll-padding-bottom');
  document.body.style.removeProperty('padding-bottom');
}

function reserveClearance(stack: HTMLElement): () => void {
  const reserve = (): void => {
    const { top } = stack.getBoundingClientRect();
    setClearance(`${window.innerHeight - top}px`);
    revealFocused(stack, top);
  };
  reserve();
  window.addEventListener('resize', reserve);
  return (): void => {
    window.removeEventListener('resize', reserve);
    clearClearance();
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
