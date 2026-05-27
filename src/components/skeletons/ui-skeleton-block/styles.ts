import type { SxProps, Theme } from '@mui/material';

import { baseSkeletonStyle } from '@/components/skeletons/base/styles';

export default function getBlockSkeletonStyles(
  width: string | number,
  height: string | number,
  borderRadius: string | number
): SxProps<Theme> {
  return {
    ...baseSkeletonStyle,
    width,
    height,
    borderRadius,
  };
}
