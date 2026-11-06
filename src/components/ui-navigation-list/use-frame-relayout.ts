import { useLayoutEffect } from 'react';

import type { ActivateHandler } from '@/components/types/ui-sidebar';

class FrameRelayoutAdapter {
  private frame = 0;

  private readonly follow: ActivateHandler;

  constructor(follow: ActivateHandler) {
    this.follow = follow;
  }

  public attach(): () => void {
    this.follow();
    window.addEventListener('scroll', this.schedule, true);
    window.addEventListener('resize', this.schedule);

    return this.detach;
  }

  private readonly schedule = (): void => {
    if (this.frame !== 0) return;
    this.frame = window.requestAnimationFrame(this.run);
  };

  private readonly run = (): void => {
    this.frame = 0;
    this.follow();
  };

  private readonly detach = (): void => {
    window.removeEventListener('scroll', this.schedule, true);
    window.removeEventListener('resize', this.schedule);
    window.cancelAnimationFrame(this.frame);
  };
}

export default function useFrameRelayout(follow: ActivateHandler): void {
  useLayoutEffect(() => new FrameRelayoutAdapter(follow).attach(), [follow]);
}
