import UIButton from '@/components/ui-button';
import UITypography from '@/components/ui-typography';
import { Box } from '@mui/material';
import { lazy, startTransition, useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';

import RegistrationForm from '@/modules/User/features/Auth/components/form-section/auth-forms/registration-form';
import AuthProviderButtons from '@/modules/User/features/Auth/components/form-section/components/auth-provider-buttons';
import styles from '@/modules/User/features/Auth/components/form-section/styles';
import {
  AuthMode,
  RegistrationView,
} from '@/modules/User/features/Auth/components/form-section/types';
import loadLoginForm from '@/modules/User/features/Auth/utils/load-login-form';

const LoginForm = lazy(loadLoginForm);

export default function FormSection(): JSX.Element {
  const [isLoadingLogin, setIsLoadingLogin] = useState(false);
  const [loadLoginError, setLoadLoginError] = useState<string | null>(null);
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
        setLoadLoginError('sign_in.errors.load_failed');
      })
      .finally(() => {
        setIsLoadingLogin(false);
      });
  }, [isLoadingLogin, mode]);

  const handleRegistrationViewChange = useCallback((view: RegistrationView) => {
    setRegistrationView(view);
  }, []);

  const showNotification = mode === 'register' && registrationView !== 'form';

  return (
    <Box component="section" sx={styles.formSection}>
      <Box sx={[styles.formWrapper, showNotification ? styles.formWrapperWithNotification : {}]}>
        {mode === 'login' ? (
          <LoginForm />
        ) : (
          <RegistrationForm onViewChange={handleRegistrationViewChange} />
        )}

        <Box
          id="auth-provider-buttons-container"
          data-testid="auth-provider-buttons-container"
          ref={(el: HTMLDivElement | null) => {
            if (el) {
              if (showNotification) el.setAttribute('inert', '');
              else el.removeAttribute('inert');
            }
          }}
        >
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
      >
        {mode === 'login'
          ? t('sign_up.form.switcher_text_no_account')
          : t('sign_up.form.switcher_text_have_account')}
      </UIButton>
    </Box>
  );
}
