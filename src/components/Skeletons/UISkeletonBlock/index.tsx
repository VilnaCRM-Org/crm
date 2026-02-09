import Box from '@mui/material/Box';

import getBlockSkeletonStyles from './styles';
import { UISkeletonBlockProps } from './types';

function UISkeletonBlock({
  width = '100%',
  height = '3rem',
  borderRadius = '8px',
  sx,
  'data-testid': dataTestId,
}: UISkeletonBlockProps): React.ReactElement {
  return (
    <Box
      sx={[getBlockSkeletonStyles(width, height, borderRadius), ...(Array.isArray(sx) ? sx : [sx])]}
      data-testid={dataTestId}
    />
  );
}

export default UISkeletonBlock;
