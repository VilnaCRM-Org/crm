import { useLayoutEffect } from 'react';

import type { FollowedEvent } from '@/components/types/ui-bell-notice';

function follow(type: FollowedEvent, run: () => void): () => void {
  let frame = 0;
  const schedule = (): void => {
    window.cancelAnimationFrame(frame);
    frame = window.requestAnimationFrame(run);
  };
  window.addEventListener(type, schedule);

  return (): void => {
    window.removeEventListener(type, schedule);
    window.cancelAnimationFrame(frame);
  };
}

export default function useFrameFollow(type: FollowedEvent, run: () => void): void {
  useLayoutEffect(() => follow(type, run), [type, run]);
}
