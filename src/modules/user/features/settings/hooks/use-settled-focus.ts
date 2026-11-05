import { type RefObject, useLayoutEffect } from 'react';

function settledTarget(
  save: HTMLButtonElement | null,
  heading: HTMLElement | null
): HTMLElement | null {
  const active = document.activeElement;
  const onBody = active === document.body;
  if (save?.disabled) return onBody ? heading : null;
  return onBody || save?.form?.contains(active) ? save : null;
}

export default function useSettledFocus(
  settled: number,
  saveRef: RefObject<HTMLButtonElement | null>,
  headingRef: RefObject<HTMLElement | null>
): void {
  useLayoutEffect(() => {
    if (settled > 0) settledTarget(saveRef.current, headingRef.current)?.focus();
  }, [settled, saveRef, headingRef]);
}
