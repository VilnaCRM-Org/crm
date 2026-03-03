import UIButton from '@/components/ui-button';
import { Box } from '@mui/material';
import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { LoginForm, RegistrationForm } from './auth-forms';
import AuthProviderButtons from './components/auth-provider-buttons';
import styles from './styles';
import { AuthMode, RegistrationView } from './types';

export default function FormSection(): JSX.Element {
  const [mode, setMode] = useState<AuthMode>('register');
  const [registrationView, setRegistrationView] = useState<RegistrationView>('form');
  const { t } = useTranslation();

  const handleSwitch = useCallback(() => {
    setRegistrationView('form');
    setMode((prev) => (prev === 'login' ? 'register' : 'login'));
  }, []);

  const handleRegistrationViewChange = useCallback((view: RegistrationView) => {
    setRegistrationView(view);
  }, []);

  const showRegistrationReplacement = mode === 'register' && registrationView !== 'form';

  return (
    <Box component="section" sx={styles.formSection}>
      <Box
        sx={[
          styles.formWrapper,
          showRegistrationReplacement ? styles.formWrapperWithNotification : {},
        ]}
      >
        {mode === 'login' ? (
          <LoginForm />
        ) : (
          <RegistrationForm onViewChange={handleRegistrationViewChange} />
        )}

        <Box
          ref={(el: HTMLDivElement | null) => {
            if (el) {
              if (showRegistrationReplacement) el.setAttribute('inert', '');
              else el.removeAttribute('inert');
            }
          }}
        >
          <AuthProviderButtons />
        </Box>
      </Box>

      <UIButton
        sx={[styles.formSwitcherButton, showRegistrationReplacement ? styles.hiddenElement : {}]}
        onClick={handleSwitch}
      >
        {mode === 'login'
          ? t('sign_up.form.switcher_text_no_account')
          : t('sign_up.form.switcher_text_have_account')}
      </UIButton>
    </Box>
  );
}
