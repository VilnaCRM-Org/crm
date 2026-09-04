import { Box } from '@mui/material';
import { useTranslation } from 'react-i18next';

import UILink from '@/components/ui-link';
import useFeatureFlag from '@/hooks/use-feature-flag';
import ROUTE_PATHS from '@/routes/route-paths';

import RememberMeField from './remember-me-field';
import styles from './styles';

export default function UserOptions(): JSX.Element | null {
  const { t } = useTranslation();
  const showForgotPassword = useFeatureFlag('forgotPassword');
  const showRememberMe = useFeatureFlag('rememberMe');

  if (!showRememberMe && !showForgotPassword) return null;

  return (
    <Box sx={styles.authOptionsWrapper}>
      {showRememberMe && <RememberMeField />}

      {showForgotPassword && (
        <UILink href={ROUTE_PATHS.passwordRecovery} sx={styles.forgotPasswordLink}>
          {t('sign_in.form.forgot_password')}
        </UILink>
      )}
    </Box>
  );
}
