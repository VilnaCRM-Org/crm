import UIButton from '@/components/UIButton';
import { Box } from '@mui/material';
import { ThemeProvider } from '@mui/material/styles';
import { useCallback, useState } from 'react';

import { LoginForm, RegistrationForm } from './AuthForms';
import AuthProviderButtons from './components/AuthProviderButtons';
import styles from './styles';
import Theme from './Theme';
import { AuthMode } from './types';

export default function FormSection(): JSX.Element {
  const [mode, setMode] = useState<AuthMode>('login');

  const handleSwitch = useCallback(() => {
    setMode((prev) => (prev === 'login' ? 'register' : 'login'));
  }, []);

  return (
    <ThemeProvider theme={Theme}>
      <Box component="section" sx={styles.formSection}>
        <Box sx={styles.formWrapper}>
          {mode === 'login' ? <LoginForm /> : <RegistrationForm />}
          <AuthProviderButtons />
        </Box>

        <UIButton sx={styles.formSwitcherButton} onClick={handleSwitch}>
          {mode === 'login' ? 'У Вас немає аккаунту?' : 'У вас уже є аккаунт'}
        </UIButton>
      </Box>
    </ThemeProvider>
  );
}
