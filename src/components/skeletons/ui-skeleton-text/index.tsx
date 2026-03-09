import Box from '@mui/material/Box';

import getTextSkeletonStyles from '@/components/skeletons/ui-skeleton-text/styles';
import type { UISkeletonTextProps } from '@/components/skeletons/ui-skeleton-text/types';

function UISkeletonText({
  id,
  size = 'm',
  width = '100%',
  sx = [],
}: UISkeletonTextProps): JSX.Element {
  return (
    <Box
      id={id}
      sx={[getTextSkeletonStyles(size, width), ...(Array.isArray(sx) ? sx : [sx])]}
    />
  );
}

export default UISkeletonText;
