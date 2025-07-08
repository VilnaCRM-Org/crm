import UIButton from '@/components/UIButton';
import { Box } from '@mui/material';
import { ThemeProvider } from '@mui/material/styles';
import { useCallback, useMemo, useState } from 'react';

import Form from './Form';
import styles from './styles';
import Theme from './Theme';
import ThirdPartyAuth from './ThirdPartyAuth';

export default function FormSection(): JSX.Element {
  const [isLoginMode, setIsLoginMode] = useState(false);

  const handleSwitch = useCallback(() => {
    setIsLoginMode((prev) => !prev);
  }, []);

  const switchCaption = useMemo(
    () => (isLoginMode ? 'У Вас немає аккаунту?' : 'У вас уже є аккаунт?'),
    [isLoginMode]
  );
  return (
    <ThemeProvider theme={Theme}>
      <Box component="section" sx={styles.formSection}>
        <Box sx={styles.formWrapper}>
          <Form isLoginMode={isLoginMode} />
          <ThirdPartyAuth />
        </Box>
        <UIButton sx={styles.formSwitcherButton} onClick={handleSwitch}>
          {switchCaption}
        </UIButton>
      </Box>
    </ThemeProvider>
  );
}
