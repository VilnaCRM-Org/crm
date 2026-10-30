import { useCallback, useLayoutEffect, useState } from 'react';

import type { RailTooltipPosition } from '@/components/types/ui-navigation-list';
import type { ActivateHandler } from '@/components/types/ui-sidebar';

const measure = (anchor: HTMLElement, offset: RailTooltipPosition): RailTooltipPosition => {
  const box = anchor.getBoundingClientRect();

  return { left: box.left + offset.left, top: box.top + offset.top };
};

function useRelayout(follow: ActivateHandler): void {
  useLayoutEffect(() => {
    follow();
    window.addEventListener('scroll', follow, true);
    window.addEventListener('resize', follow);

    return (): void => {
      window.removeEventListener('scroll', follow, true);
      window.removeEventListener('resize', follow);
    };
  }, [follow]);
}

export default function useRailTooltipPosition(
  anchor: HTMLElement,
  offset: RailTooltipPosition
): RailTooltipPosition {
  const [position, setPosition] = useState(() => measure(anchor, offset));
  const follow = useCallback(() => setPosition(measure(anchor, offset)), [anchor, offset]);
  useRelayout(follow);

  return position;
}
