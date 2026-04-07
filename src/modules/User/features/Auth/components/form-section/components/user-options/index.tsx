import UIButton from '@/components/UIButton';
import { Box, FormControlLabel, Checkbox } from '@mui/material';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import {
  CheckBoxChecked,
  CheckBoxIcon,
} from '@/modules/User/features/Auth/components/form-section/components/user-options/checkbox-icons';
import styles from '@/modules/User/features/Auth/components/form-section/components/user-options/styles';

export default function UserOptions(): JSX.Element {
  const [isChecked, setIsChecked] = useState(false);
  const { t } = useTranslation();

  const onChange = (): void => setIsChecked(!isChecked);
  return (
    <Box sx={styles.authOptionsWrapper}>
      <FormControlLabel
        label={t('sign_in.form.remember_me')}
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
        {t('sign_in.form.forgot_password')}
      </UIButton>
    </Box>
  );
}
