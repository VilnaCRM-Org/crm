import { Box, FormControlLabel, Checkbox } from '@mui/material';
import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';

import featureFlags from '@/config/env/feature-flags';

import { CheckBoxChecked, CheckBoxIcon } from './checkbox-icons';
import styles from './styles';

export default function UserOptions(): JSX.Element | null {
  const [isChecked, setIsChecked] = useState(false);
  const { t } = useTranslation();

  const handleCheckboxChange = useCallback((): void => {
    setIsChecked((prev) => !prev);
  }, []);

  if (!featureFlags.rememberMe()) return null;

  return (
    <Box sx={styles.authOptionsWrapper}>
      <FormControlLabel
        label={t('sign_in.form.remember_me')}
        sx={styles.rememberMeLabel}
        id="remember-me"
        control={
          <Checkbox
            checked={isChecked}
            onChange={handleCheckboxChange}
            icon={<CheckBoxIcon />}
            checkedIcon={<CheckBoxChecked />}
            sx={styles.rememberMeCheckbox}
          />
        }
      />
    </Box>
  );
}
