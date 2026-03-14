import Box from '@mui/material/Box';

import styles from '@/components/Skeletons/UISkeletonInput/styles';
import { UISkeletonInputProps } from '@/components/Skeletons/UISkeletonInput/types';

function UISkeletonInput({ 'data-testid': dataTestId }: UISkeletonInputProps): JSX.Element {
  return (
    <Box sx={styles.inputContainer} data-testid={dataTestId}>
      <Box sx={styles.inputPlaceholder} data-testid="skeleton-placeholder" />
    </Box>
  );
}

export default UISkeletonInput;
