import { Box } from '@mui/material';
import { lazy, startTransition, Suspense, useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';

import UIButton from '@/components/ui-button';
import UITypography from '@/components/ui-typography';
import RegistrationForm from '@auth/components/form-section/auth-forms/registration-form';
import AuthProviderButtons from '@auth/components/form-section/components/auth-provider-buttons';
import loadLoginForm from '@auth/utils/load-login-form';

import styles from './styles';
import { AuthMode, RegistrationView } from './types';

const LoginForm = lazy(loadLoginForm);
const LOAD_LOGIN_ERROR_KEY = 'sign_in.errors.load_failed' as const;

export default function FormSection(): JSX.Element {
  const [isLoadingLogin, setIsLoadingLogin] = useState(false);
  const [loadLoginError, setLoadLoginError] = useState<typeof LOAD_LOGIN_ERROR_KEY | null>(null);
  const [mode, setMode] = useState<AuthMode>('register');
  const [registrationView, setRegistrationView] = useState<RegistrationView>('form');
  const { t } = useTranslation();

  const handleSwitcherIntent = useCallback(() => {
    if (mode === 'register') {
      loadLoginForm().catch(() => undefined);
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
        setLoadLoginError(LOAD_LOGIN_ERROR_KEY);
      })
      .finally(() => {
        setIsLoadingLogin(false);
      });
  }, [isLoadingLogin, mode]);

  const handleRegistrationViewChange = useCallback((view: RegistrationView) => {
    setRegistrationView(view);
  }, []);

  const showNotification = mode === 'register' && registrationView !== 'form';

  const setProviderButtonsInert = useCallback(
    (el: HTMLDivElement | null): void => {
      if (!el) return;
      if (showNotification) {
        el.setAttribute('inert', '');
      } else {
        el.removeAttribute('inert');
      }
    },
    [showNotification]
  );

  return (
    <Box component="section" sx={styles.formSection}>
      <Box sx={styles.formWrapper}>
        {mode === 'login' ? (
          <Suspense fallback={<Box aria-hidden="true" />}>
            <LoginForm />
          </Suspense>
        ) : (
          <RegistrationForm onViewChange={handleRegistrationViewChange} />
        )}

        <Box id="auth-provider-buttons-container" ref={setProviderButtonsInert}>
          <AuthProviderButtons />
        </Box>
      </Box>

      {loadLoginError ? (
        <UITypography role="alert" sx={styles.formSwitcherError}>
          {t(loadLoginError)}
        </UITypography>
      ) : null}

      <UIButton
        sx={styles.formSwitcherButton}
        onClick={handleSwitch}
        onMouseEnter={handleSwitcherIntent}
        onFocus={handleSwitcherIntent}
        onTouchStart={handleSwitcherIntent}
        disabled={isLoadingLogin}
        data-testid="signup-switcher"
      >
        {mode === 'login'
          ? t('sign_up.form.switcher_text_no_account')
          : t('sign_up.form.switcher_text_have_account')}
      </UIButton>
    </Box>
  );
}
