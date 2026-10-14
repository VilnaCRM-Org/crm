import { Box } from '@mui/material';
import type { JSX } from 'react';

import AuthProviderButtons from '@auth/components/form-section/components/auth-provider-buttons';
import InertBox from '@auth/components/form-section/inert-box';
import styles from '@auth/components/form-section/styles';
import type { AuthFormSectionProps } from '@auth/types/auth-form-section';

export default function AuthFormSection({
  children,
  oauthInert,
  page,
  switcher,
}: AuthFormSectionProps): JSX.Element {
  return (
    <Box component="section" sx={styles.formSection}>
      <Box id="auth-form-card" sx={[styles.formWrapper, styles.formWrapperBottomPadding[page]]}>
        {children}
        <InertBox id="auth-provider-buttons-container" inert={oauthInert}>
          <AuthProviderButtons />
        </InertBox>
      </Box>
      {switcher}
    </Box>
  );
}
