import { useLayoutEffect } from 'react';

import type { NotificationViewSet } from '@/lib/notifications/types/notification-view';

function followResize(measure: () => void): () => void {
  let frame = 0;
  const schedule = (): void => {
    window.cancelAnimationFrame(frame);
    frame = window.requestAnimationFrame(measure);
  };
  window.addEventListener('resize', schedule);

  return (): void => {
    window.removeEventListener('resize', schedule);
    window.cancelAnimationFrame(frame);
  };
}

export default function useMeasureOnResize(
  measure: () => void,
  release: () => void,
  rerunOn?: NotificationViewSet
): void {
  useLayoutEffect(() => {
    measure();
    const stop = followResize(measure);

    return (): void => {
      stop();
      release();
    };
  }, [measure, release, rerunOn]);
}
