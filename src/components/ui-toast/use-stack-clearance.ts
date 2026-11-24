import { type RefObject, useLayoutEffect } from 'react';

import type { ToastItemSet } from '@/components/types/ui-toast';

import FocusClearanceDetector from './focus-clearance-detector';

function revealAbove(focused: Element | null, top: number): void {
  if (focused !== null && focused.getBoundingClientRect().bottom > top) {
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

function reserve(stack: HTMLElement, focus: FocusClearanceDetector, kept: Element | null): void {
  const { top } = stack.getBoundingClientRect();
  setClearance(`${window.innerHeight - top}px`);
  if (top <= 0) return;
  const focused = focus.focused();
  if (focused === kept) revealAbove(focused, top);
  focus.settle(top);
}

function listen(resized: () => void, moved: () => void): () => void {
  window.addEventListener('resize', resized);
  window.addEventListener('scroll', moved, true);
  document.addEventListener('focusin', moved);
  return (): void => {
    window.removeEventListener('resize', resized);
    window.removeEventListener('scroll', moved, true);
    document.removeEventListener('focusin', moved);
    clearClearance();
  };
}

function reserveClearance(stack: HTMLElement): () => void {
  const focus = new FocusClearanceDetector(stack);
  reserve(stack, focus, focus.focused());
  return listen(
    () => reserve(stack, focus, focus.lastClear()),
    () => focus.follow()
  );
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
