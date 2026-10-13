import { Box } from '@mui/material';
import type { JSX } from 'react';

import styles from '@auth/components/form-section/styles';
import type { AuthCardProps } from '@auth/types/auth-card';

export default function AuthCard({ children, after, page }: AuthCardProps): JSX.Element {
  const wrapper =
    page === undefined
      ? styles.formWrapper
      : [styles.formWrapper, styles.formWrapperBottomPadding[page]];
  return (
    <Box component="section" sx={styles.formSection}>
      <Box id="auth-form-card" sx={wrapper}>
        {children}
      </Box>
      {after}
    </Box>
  );
}
