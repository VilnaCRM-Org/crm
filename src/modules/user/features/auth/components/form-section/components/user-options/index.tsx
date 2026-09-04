import { Box, FormControlLabel, Checkbox } from '@mui/material';
import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';

import UILink from '@/components/ui-link';
import useFeatureFlag from '@/hooks/use-feature-flag';
import ROUTE_PATHS from '@/routes/route-paths';

import { CheckBoxChecked, CheckBoxIcon } from './checkbox-icons';
import styles from './styles';

export default function UserOptions(): JSX.Element | null {
  const [isChecked, setIsChecked] = useState(false);
  const { t } = useTranslation();
  const showForgotPassword = useFeatureFlag('forgotPassword');
  const showRememberMe = useFeatureFlag('rememberMe');

  const handleCheckboxChange = useCallback(
    (): void => {
      setIsChecked((prev) => !prev);
    },
    // Stryker disable next-line ArrayDeclaration: equivalent, deps stay Object.is-equal
    []
  );

  if (!showRememberMe && !showForgotPassword) return null;

  return (
    <Box sx={styles.authOptionsWrapper}>
      {showRememberMe && (
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
      )}

      {showForgotPassword && (
        <UILink href={ROUTE_PATHS.passwordRecovery} sx={styles.forgotPasswordLink}>
          {t('sign_in.form.forgot_password')}
        </UILink>
      )}
    </Box>
  );
}
