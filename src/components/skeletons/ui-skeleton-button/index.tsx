import Box from '@mui/material/Box';

import styles from '@/components/skeletons/ui-skeleton-button/styles';
import { UISkeletonButtonProps } from '@/components/skeletons/ui-skeleton-button/types';

function UISkeletonButton({ id, sx }: UISkeletonButtonProps): JSX.Element {
  return <Box id={id} sx={[styles.buttonSkeleton, ...(Array.isArray(sx) ? sx : [sx])]} />;
}

export default UISkeletonButton;
