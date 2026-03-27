import Box from '@mui/material/Box';

import getBlockSkeletonStyles from '@/components/skeletons/ui-skeleton-block/styles';
import { UISkeletonBlockProps } from '@/components/skeletons/ui-skeleton-block/types';

function UISkeletonBlock({
  id,
  width = '100%',
  height = '3rem',
  borderRadius = '8px',
  sx = [],
}: UISkeletonBlockProps): JSX.Element {
  const additionalSx = Array.isArray(sx) ? sx : [sx];

  return (
    <Box id={id} sx={[getBlockSkeletonStyles(width, height, borderRadius), ...additionalSx]} />
  );
}

export default UISkeletonBlock;
