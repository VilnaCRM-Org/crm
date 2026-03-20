import { SKELETON_BORDER_RADIUS, baseSkeletonStyle } from '@/components/skeletons/base/styles';
import { SkeletonTextSize } from '@/components/skeletons/ui-skeleton-text/types';

const sizeHeights: Record<SkeletonTextSize, string> = {
  s: '8px',
  m: '12px',
  l: '18px',
};

type StylesObject = typeof baseSkeletonStyle & {
  height: string;
  width: string | number;
  borderRadius: string;
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
