import UIButton from '@/components/UIButton';
import { Box, FormControlLabel, Checkbox } from '@mui/material';
import React from 'react';

import styles from './styles';

export default function AuthOptions(): JSX.Element {
  return (
    <Box sx={styles.authOptionsWrapper}>
      <FormControlLabel
        control={<Checkbox color="primary" sx={styles.rememberMeCheckbox} />}
        label="Запамʼятати мене"
        sx={styles.rememberMeLabel}
        id="remember-me"
      />
      <UIButton type="button" variant="text" sx={styles.forgePassword}>
        Забули пароль?
      </UIButton>
    </Box>
  );
}
