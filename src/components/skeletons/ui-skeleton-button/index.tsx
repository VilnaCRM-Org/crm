import Box from '@mui/material/Box';

import styles from '@/components/skeletons/ui-skeleton-button/styles';
import { UISkeletonButtonProps } from '@/components/skeletons/ui-skeleton-button/types';

function UISkeletonButton({ id, sx = [] }: UISkeletonButtonProps): JSX.Element {
  const additionalSx = Array.isArray(sx) ? sx : [sx];

  return <Box id={id} sx={[styles.buttonSkeleton, ...additionalSx]} />;
}

export default UISkeletonButton;
