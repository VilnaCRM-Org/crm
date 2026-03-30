import UIButton from '@/components/UIButton';
import UITypography from '@/components/UITypography';
import { Box } from '@mui/material';
import { lazy, startTransition, useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';

import loadLoginForm from '../../utils/load-login-form';

import { RegistrationForm } from './AuthForms';
import AuthProviderButtons from './components/AuthProviderButtons';
import styles from './styles';
import { AuthMode } from './types';

const LoginForm = lazy(loadLoginForm);

export default function FormSection(): JSX.Element {
  const [isLoadingLogin, setIsLoadingLogin] = useState(false);
  const [loadLoginError, setLoadLoginError] = useState<string | null>(null);
  const [mode, setMode] = useState<AuthMode>('register');
  const { t } = useTranslation();

  const handleSwitcherIntent = useCallback(() => {
    if (mode === 'register') {
      loadLoginForm().catch(() => undefined);
    }
  }, [mode]);

  const handleSwitch = useCallback(() => {
    if (mode === 'login') {
      setLoadLoginError(null);
      setMode('register');
      return;
    }

    if (isLoadingLogin) {
      return;
    }

    setLoadLoginError(null);
    setIsLoadingLogin(true);

    loadLoginForm()
      .then(() => {
        startTransition(() => {
          setMode('login');
        });
      })
      .catch(() => {
        setLoadLoginError(t('sign_in.errors.load_failed'));
      })
      .finally(() => {
        setIsLoadingLogin(false);
      });
  }, [isLoadingLogin, mode, t]);

  return (
    <Box component="section" sx={styles.formSection}>
      <Box sx={styles.formWrapper}>
        {mode === 'login' ? <LoginForm /> : <RegistrationForm />}

        <AuthProviderButtons />
      </Box>

      {loadLoginError ? (
        <UITypography role="alert" sx={styles.formSwitcherError}>
          {loadLoginError}
        </UITypography>
      ) : null}

      <UIButton
        sx={styles.formSwitcherButton}
        onClick={handleSwitch}
        onMouseEnter={handleSwitcherIntent}
        onFocus={handleSwitcherIntent}
        onTouchStart={handleSwitcherIntent}
        disabled={isLoadingLogin}
      >
        {mode === 'login'
          ? t('sign_up.form.switcher_text_no_account')
          : t('sign_up.form.switcher_text_have_account')}
      </UIButton>
    </Box>
  );
}
