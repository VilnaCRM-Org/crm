import UIButton from '@/components/UIButton';
import UITypography from '@/components/UITypography';
import { Box } from '@mui/material';
import { lazy, startTransition, useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';

import RegistrationForm from './auth-forms/registration-form';
import AuthProviderButtons from './components/auth-provider-buttons';
import styles from './styles';
import { AuthMode, RegistrationView } from './types';

const loadLoginForm = (): Promise<typeof import('./auth-forms/login-form')> =>
  import('./auth-forms/login-form');
const LoginForm = lazy(loadLoginForm);

export default function FormSection(): JSX.Element {
  const [isLoadingLogin, setIsLoadingLogin] = useState(false);
  const [loadLoginError, setLoadLoginError] = useState<string | null>(null);
  const [mode, setMode] = useState<AuthMode>('register');
  const [registrationView, setRegistrationView] = useState<RegistrationView>('form');
  const { t } = useTranslation();

  const handleSwitcherIntent = useCallback(() => {
    if (mode === 'register') {
      loadLoginForm().catch((): undefined => undefined);
    }
  }, [mode]);

  const handleSwitch = useCallback(() => {
    setRegistrationView('form');

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

  const handleRegistrationViewChange = useCallback((view: RegistrationView) => {
    setRegistrationView(view);
  }, []);

  const showNotification = mode === 'register' && registrationView !== 'form';

  return (
    <Box component="section" sx={styles.formSection}>
      <Box sx={styles.formWrapper}>
        {mode === 'login' ? (
          <LoginForm />
        ) : (
          <RegistrationForm onViewChange={handleRegistrationViewChange} />
        )}

        <Box
          id="auth-provider-buttons-container"
          ref={(el: HTMLDivElement | null) => {
            if (el) {
              if (showNotification) {
                el.setAttribute('inert', '');
              } else {
                el.removeAttribute('inert');
              }
            }
          }}
        >
          <AuthProviderButtons />
        </Box>
      </Box>

      {loadLoginError ? (
        <UITypography role="alert">
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
