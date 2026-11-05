import { type RefObject, useLayoutEffect } from 'react';

export default function useSettledFocus(
  settled: number,
  saveRef: RefObject<HTMLButtonElement | null>
): void {
  useLayoutEffect(() => {
    const active = document.activeElement;
    const save = saveRef.current;
    if (settled > 0 && (active === document.body || save?.form?.contains(active))) save?.focus();
  }, [settled, saveRef]);
}
