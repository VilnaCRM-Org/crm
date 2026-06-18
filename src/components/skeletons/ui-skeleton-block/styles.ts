import type { SxProps, Theme } from '@mui/material';

import { baseSkeletonStyle } from '@/components/skeletons/base/styles';

class BlockSkeletonStyles {
  public build(
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
}

const blockSkeletonStyles = new BlockSkeletonStyles();

export default blockSkeletonStyles;
