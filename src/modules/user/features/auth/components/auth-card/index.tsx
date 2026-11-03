import { Box } from '@mui/material';
import type { JSX } from 'react';

import styles from '@auth/components/form-section/styles';
import type { AuthCardProps } from '@auth/types/auth-card';

import cardStyles from './styles';

export default function AuthCard({ children, after, page, variant }: AuthCardProps): JSX.Element {
  const wrapper = [
    styles.formWrapper,
    page !== undefined && styles.formWrapperBottomPadding[page],
    variant === 'recovery' && cardStyles.recoveryCard,
  ];
  return (
    <Box component="section" sx={styles.formSection}>
      <Box id="auth-form-card" sx={wrapper}>
        {children}
      </Box>
      {after}
    </Box>
  );
}
