import { useLayoutEffect } from 'react';

import type { NotificationViewSet } from '@/lib/notifications/types/notification-view';

export default function useMeasureOnResize(
  measure: () => void,
  release: () => void,
  rerunOn?: NotificationViewSet
): void {
  useLayoutEffect(() => {
    measure();
    window.addEventListener('resize', measure);

    return (): void => {
      window.removeEventListener('resize', measure);
      release();
    };
  }, [measure, release, rerunOn]);
}
