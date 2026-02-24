import UIButton from '@/components/UIButton';
import loadFonts from '@/utils/loadFonts';
import { Box } from '@mui/material';
import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { LoginForm, RegistrationForm } from './AuthForms';
import AuthProviderButtons from './components/AuthProviderButtons';
import styles from './styles';
import { AuthMode } from './types';

let fontsLoaded = false;
const fontsPromise = loadFonts().then(
  () => {
    fontsLoaded = true;
  },
  () => {
    fontsLoaded = true;
  }
);

export default function FormSection(): JSX.Element {
  if (!fontsLoaded) throw fontsPromise;

  const [mode, setMode] = useState<AuthMode>('register');
  const { t } = useTranslation();

  const handleSwitch = useCallback(() => {
    setMode((prev) => (prev === 'login' ? 'register' : 'login'));
  }, []);

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
