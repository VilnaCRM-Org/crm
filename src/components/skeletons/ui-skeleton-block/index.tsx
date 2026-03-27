import Box from '@mui/material/Box';

import getBlockSkeletonStyles from '@/components/skeletons/ui-skeleton-block/styles';
import { UISkeletonBlockProps } from '@/components/skeletons/ui-skeleton-block/types';

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
      sx={[getBlockSkeletonStyles(width, height, borderRadius), ...(Array.isArray(sx) ? sx : [sx])]}
    />
  );
}

export default UISkeletonBlock;
