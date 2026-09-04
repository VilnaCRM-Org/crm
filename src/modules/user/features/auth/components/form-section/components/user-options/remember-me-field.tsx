import { Checkbox, FormControlLabel } from '@mui/material';
import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { CheckBoxChecked, CheckBoxIcon } from './checkbox-icons';
import styles from './styles';

export default function RememberMeField(): JSX.Element {
  const [isChecked, setIsChecked] = useState(false);
  const { t } = useTranslation();

  const handleCheckboxChange = useCallback(
    (): void => {
      setIsChecked((prev) => !prev);
    },
    // Stryker disable next-line ArrayDeclaration: equivalent, deps stay Object.is-equal
    []
  );

  return (
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
  );
}
