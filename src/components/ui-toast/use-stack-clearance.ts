import { type RefObject, useLayoutEffect } from 'react';

export default function useStackClearance(
  stackRef: RefObject<HTMLElement | null>,
  count: number
): void {
  useLayoutEffect(() => {
    const height = stackRef.current?.getBoundingClientRect().height;
    if (height === undefined) return undefined;
    const root = document.documentElement;
    root.style.setProperty('scroll-padding-bottom', `${height}px`);
    return (): void => {
      root.style.removeProperty('scroll-padding-bottom');
    };
  }, [count, stackRef]);
}
