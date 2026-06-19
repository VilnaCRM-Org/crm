import { SKELETON_BORDER_RADIUS, baseSkeletonStyle } from '@/components/skeletons/base/styles';
import type { SkeletonTextSize } from '@/components/skeletons/ui-skeleton-text/types';

import type { StylesObject } from './styles.types';

const sizeHeights: Record<SkeletonTextSize, string> = {
  s: '8px',
  m: '12px',
  l: '18px',
};

export default function getTextSkeletonStyles(
  size: SkeletonTextSize,
  width: string | number
): StylesObject {
  return {
    ...baseSkeletonStyle,
    height: sizeHeights[size],
    width,
    borderRadius: SKELETON_BORDER_RADIUS,
  };
}
