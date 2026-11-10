import { useCallback, useState } from 'react';

import type { RailTooltipPosition } from '@/components/types/ui-navigation-list';

import useFrameRelayout from './use-frame-relayout';

const measure = (anchor: HTMLElement, offset: RailTooltipPosition): RailTooltipPosition => {
  const box = anchor.getBoundingClientRect();

  return { left: box.left + offset.left, top: box.top + offset.top };
};

export default function useRailTooltipPosition(
  anchor: HTMLElement,
  offset: RailTooltipPosition
): RailTooltipPosition {
  const [position, setPosition] = useState(() => measure(anchor, offset));
  const follow = useCallback(() => setPosition(measure(anchor, offset)), [anchor, offset]);
  useFrameRelayout(follow);

  return position;
}
