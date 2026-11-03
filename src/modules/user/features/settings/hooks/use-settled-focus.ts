import { type RefObject, useLayoutEffect } from 'react';

export default function useSettledFocus(
  settled: number,
  saveRef: RefObject<HTMLButtonElement | null>
): void {
  useLayoutEffect(() => {
    if (settled > 0 && document.activeElement === document.body) saveRef.current?.focus();
  }, [settled, saveRef]);
}
