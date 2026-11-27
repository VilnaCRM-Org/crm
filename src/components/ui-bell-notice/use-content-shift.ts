import { useLayoutEffect } from 'react';

export default function useContentShift(run: () => void): void {
  useLayoutEffect(() => {
    if (typeof ResizeObserver === 'undefined') return undefined;
    const observer = new ResizeObserver(() => run());
    observer.observe(document.body);

    return (): void => observer.disconnect();
  }, [run]);
}
