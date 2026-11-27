import { useLayoutEffect } from 'react';

import type { NotificationViewSet } from '@/lib/notifications/types/notification-view';

import useFrameFollow from './use-frame-follow';

export default function useMeasureOnResize(
  measure: () => void,
  release: () => void,
  rerunOn?: NotificationViewSet
): void {
  useLayoutEffect(() => {
    measure();

    return release;
  }, [measure, release, rerunOn]);
  useFrameFollow('resize', measure);
}
