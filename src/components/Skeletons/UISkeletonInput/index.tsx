import Box from '@mui/material/Box';

import styles from './styles';
import { UISkeletonInputProps } from './types';

function UISkeletonInput({
  'data-testid': dataTestId,
}: UISkeletonInputProps): React.ReactElement {
  return (
    <Box sx={styles.inputContainer} data-testid={dataTestId}>
      <Box sx={styles.inputPlaceholder} />
    </Box>
  );
}

export default UISkeletonInput;
