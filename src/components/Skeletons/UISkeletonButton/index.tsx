import Box from '@mui/material/Box';

import styles from '@/components/Skeletons/UISkeletonButton/styles';
import { UISkeletonButtonProps } from '@/components/Skeletons/UISkeletonButton/types';

function UISkeletonButton({
  sx,
  'data-testid': dataTestId,
}: UISkeletonButtonProps): JSX.Element {
  return (
    <Box
      sx={[styles.buttonSkeleton, ...(Array.isArray(sx) ? sx : [sx])]}
      data-testid={dataTestId}
    />
  );
}

export default UISkeletonButton;
