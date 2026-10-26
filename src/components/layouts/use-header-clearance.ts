import { useLayoutEffect } from 'react';

export default function useHeaderClearance(height: string): void {
  useLayoutEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('scroll-padding-top', height);

    return (): void => {
      root.style.removeProperty('scroll-padding-top');
    };
  }, [height]);
}
