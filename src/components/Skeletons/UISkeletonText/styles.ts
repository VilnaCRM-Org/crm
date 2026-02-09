import { baseSkeletonStyle } from '@/components/Skeletons/base/styles';

import { SkeletonTextSize } from './types';

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
    borderRadius: '57px',
  };
}
