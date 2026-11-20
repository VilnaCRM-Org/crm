import { type RefObject, useLayoutEffect } from 'react';

import type { NotificationViewSet } from '@/lib/notifications/types/notification-view';

function revealFocused(stack: HTMLElement, top: number): void {
  const focused = document.activeElement ?? document.body;
  const outside = focused !== document.body && !stack.contains(focused);
  if (outside && focused.getBoundingClientRect().bottom > top) {
    focused.scrollIntoView({ block: 'nearest' });
  }
}

const STACK_CLEARANCE_PROPERTY = '--toast-stack-clearance';

function setClearance(value: string): void {
  document.documentElement.style.setProperty('scroll-padding-bottom', value);
  document.documentElement.style.setProperty(STACK_CLEARANCE_PROPERTY, value);
  document.body.style.setProperty('padding-bottom', value);
}

function clearClearance(): void {
  document.documentElement.style.removeProperty('scroll-padding-bottom');
  document.documentElement.style.removeProperty(STACK_CLEARANCE_PROPERTY);
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
  toasts: NotificationViewSet
): void {
  useLayoutEffect(() => {
    const stack = stackRef.current;
    return stack === null ? undefined : reserveClearance(stack);
  }, [toasts, stackRef]);
}
