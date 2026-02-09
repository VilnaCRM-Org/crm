import Box from '@mui/material/Box';

import styles from './styles';
import { UISkeletonButtonProps } from './types';

function UISkeletonButton({
  sx,
  'data-testid': dataTestId,
}: UISkeletonButtonProps): React.ReactElement {
  return (
    <Box
      sx={[styles.buttonSkeleton, ...(Array.isArray(sx) ? sx : [sx])]}
      data-testid={dataTestId}
    />
  );
}

export default UISkeletonButton;
