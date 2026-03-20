import Box from '@mui/material/Box';

import styles from '@/components/skeletons/ui-skeleton-input/styles';
import type { UISkeletonInputProps } from '@/components/skeletons/ui-skeleton-input/types';

function UISkeletonInput({ id }: UISkeletonInputProps): JSX.Element {
  return (
    <Box id={id} sx={styles.inputContainer}>
      <Box className="ui-skeleton-input__placeholder" sx={styles.inputPlaceholder} />
    </Box>
  );
}

export default UISkeletonInput;
