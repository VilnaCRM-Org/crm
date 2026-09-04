import { Box } from '@mui/material';

import useFeatureFlag from '@/hooks/use-feature-flag';
import AuthProviderButtons from '@auth/components/form-section/components/auth-provider-buttons';
import InertBox from '@auth/components/form-section/inert-box';
import styles from '@auth/components/form-section/styles';
import type { AuthFormSectionProps } from '@auth/types/auth-form-section';

export default function AuthFormSection({
  children,
  oauthInert,
  switcher,
}: AuthFormSectionProps): JSX.Element {
  const showOauthProviders = useFeatureFlag('oauthProviders');

  return (
    <Box component="section" sx={styles.formSection}>
      <Box sx={styles.formWrapper}>
        {children}
        {showOauthProviders && (
          <InertBox id="auth-provider-buttons-container" inert={oauthInert}>
            <AuthProviderButtons />
          </InertBox>
        )}
      </Box>
      {switcher}
    </Box>
  );
}
