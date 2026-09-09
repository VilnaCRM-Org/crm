import Box from '@mui/material/Box';
import { useTheme } from '@mui/material/styles';

import styles from '@/components/skeletons/ui-skeleton-input/styles';
import type { UISkeletonInputProps } from '@/components/skeletons/ui-skeleton-input/types';

function UISkeletonInput({ disableAnimation = false, id }: UISkeletonInputProps): JSX.Element {
  const theme = useTheme();
  const staticSx = disableAnimation ? styles.staticSkeleton : undefined;

  return (
    <Box id={id} sx={[styles.inputContainer(theme), ...(staticSx ? [staticSx] : [])]}>
      <Box
        className="ui-skeleton-input__placeholder"
        sx={[styles.inputPlaceholder, ...(staticSx ? [staticSx] : [])]}
      />
    </Box>
  );
}

export default UISkeletonInput;
