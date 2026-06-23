import type { baseSkeletonStyle } from '@/components/skeletons/base/styles';

export type StylesObject = typeof baseSkeletonStyle & {
  height: string;
  width: string | number;
  borderRadius: string;
};
