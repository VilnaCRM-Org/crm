import type { SxProps, Theme } from '@mui/material';
import Box from '@mui/material/Box';

import getBlockSkeletonStyles from '@/components/skeletons/ui-skeleton-block/styles';
import type { UISkeletonBlockProps } from '@/components/skeletons/ui-skeleton-block/types';

function buildSx(base: SxProps<Theme>, extra: UISkeletonBlockProps['sx']): SxProps<Theme> {
  if (extra === undefined) {
    return base;
  }
  if (Array.isArray(extra)) {
    return [base, ...extra] as SxProps<Theme>;
  }
  return [base, extra] as SxProps<Theme>;
}

function UISkeletonBlock({
  id,
  width = '100%',
  height = '3rem',
  borderRadius = '8px',
  sx,
}: UISkeletonBlockProps): JSX.Element {
  return (
    <Box
      id={id}
      sx={buildSx(getBlockSkeletonStyles(width, height, borderRadius), sx)}
    />
  );
}

export default UISkeletonBlock;
