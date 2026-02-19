import type { SxProps, Theme } from '@mui/material';
import Box from '@mui/material/Box';

import getBlockSkeletonStyles from '@/components/Skeletons/UISkeletonBlock/styles';
import { UISkeletonBlockProps } from '@/components/Skeletons/UISkeletonBlock/types';

function buildSx(
  base: SxProps<Theme>,
  extra: UISkeletonBlockProps['sx'],
): SxProps<Theme> {
  if (extra === undefined) return base;
  if (Array.isArray(extra)) return [base, ...extra] as SxProps<Theme>;
  return [base, extra] as SxProps<Theme>;
}

function UISkeletonBlock({
  width = '100%',
  height = '3rem',
  borderRadius = '8px',
  sx,
  'data-testid': dataTestId,
}: UISkeletonBlockProps): JSX.Element {
  return (
    <Box
      sx={buildSx(getBlockSkeletonStyles(width, height, borderRadius), sx)}
      data-testid={dataTestId}
    />
  );
}

export default UISkeletonBlock;
