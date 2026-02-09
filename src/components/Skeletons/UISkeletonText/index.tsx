import Box from '@mui/material/Box';

import getTextSkeletonStyles from './styles';
import { UISkeletonTextProps } from './types';

function UISkeletonText({
  size = 'm',
  width = '100%',
  sx,
  'data-testid': dataTestId,
}: UISkeletonTextProps): React.ReactElement {
  return (
    <Box
      sx={[getTextSkeletonStyles(size, width), ...(Array.isArray(sx) ? sx : [sx])]}
      data-testid={dataTestId}
    />
  );
}

export default UISkeletonText;
