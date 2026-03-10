import UIButton from '@/components/ui-button';
import useFontsReady from '@/hooks/use-fonts-ready';
import { Box } from '@mui/material';
import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';

import AuthSkeleton from '@/modules/user/features/auth/components/auth-skeleton';

import { LoginForm, RegistrationForm } from './auth-forms';
import AuthProviderButtons from './components/auth-provider-buttons';
import styles from './styles';
import { AuthMode } from './types';

const AUTH_CRITICAL_FONTS = ['500 1rem Golos', '600 1rem Golos', '700 1rem Golos'] as const;

export default function FormSection(): JSX.Element {
  const [mode, setMode] = useState<AuthMode>('register');
  const fontsReady = useFontsReady(AUTH_CRITICAL_FONTS);
  const { t } = useTranslation();

  const handleSwitch = useCallback(() => {
    setMode((prev) => (prev === 'login' ? 'register' : 'login'));
  }, []);

  if (!fontsReady) {
    return <AuthSkeleton />;
  }

  return (
    <Box component="section" sx={styles.formSection}>
      <Box sx={styles.formWrapper}>
        {mode === 'login' ? <LoginForm /> : <RegistrationForm />}
        <AuthProviderButtons />
      </Box>

      <UIButton sx={styles.formSwitcherButton} onClick={handleSwitch}>
        {mode === 'login'
          ? t('sign_up.form.switcher_text_no_account')
          : t('sign_up.form.switcher_text_have_account')}
      </UIButton>
    </Box>
  );
}
