import { baseSkeletonStyle } from '@/components/Skeletons/base/styles';

type StylesObject = typeof baseSkeletonStyle & {
  width: string | number;
  height: string | number;
  borderRadius: string | number;
};

export default function getBlockSkeletonStyles(
  width: string | number,
  height: string | number,
  borderRadius: string | number
): StylesObject {
  return {
    ...baseSkeletonStyle,
    width,
    height,
    borderRadius,
  };
}
