import UIButton from '@/components/UIButton';
import { Box, FormControlLabel, Checkbox } from '@mui/material';
import { useState } from 'react';

import { CheckBoxChecked, CheckBoxIcon } from './checkboxIcons';
import styles from './styles';

export default function UserOptions(): JSX.Element {
  const [isChecked, setIsChecked] = useState(false);

  const onChange = (): void => setIsChecked(!isChecked);
  return (
    <Box sx={styles.authOptionsWrapper}>
      <FormControlLabel
        label="Запамʼятати мене"
        sx={styles.rememberMeLabel}
        id="remember-me"
        control={
          <Checkbox
            checked={isChecked}
            onChange={onChange}
            icon={<CheckBoxIcon />}
            checkedIcon={<CheckBoxChecked />}
            sx={styles.rememberMeCheckbox}
          />
        }
      />

      <UIButton type="button" variant="text" sx={styles.forgePassword}>
        Забули пароль?
      </UIButton>
    </Box>
  );
}
