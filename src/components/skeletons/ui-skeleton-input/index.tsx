import Box from '@mui/material/Box';

import styles from '@/components/skeletons/ui-skeleton-input/styles';
import { UISkeletonInputProps } from '@/components/skeletons/ui-skeleton-input/types';

function UISkeletonInput({ disableAnimation = false, id }: UISkeletonInputProps): JSX.Element {
  const staticSx = disableAnimation ? styles.staticSkeleton : undefined;

  return (
    <Box id={id} sx={[styles.inputContainer, ...(staticSx ? [staticSx] : [])]}>
      <Box
        className="ui-skeleton-input__placeholder"
        sx={[styles.inputPlaceholder, ...(staticSx ? [staticSx] : [])]}
      />
    </Box>
  );
}

export default UISkeletonInput;
