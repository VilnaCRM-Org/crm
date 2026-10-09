import { Box } from '@mui/material';
import { type JSX, useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';

import UICheckbox from '@/components/ui-checkbox';
import UITextLink from '@/components/ui-text-link';
import useFeatureFlag from '@/hooks/use-feature-flag';
import ROUTE_PATHS from '@/routes/route-paths';

import styles from './styles';

export default function UserOptions(): JSX.Element {
  const [isChecked, setIsChecked] = useState(false);
  const { t } = useTranslation();
  const showForgotPassword = useFeatureFlag('forgotPassword');

  const handleCheckboxChange = useCallback(
    (): void => {
      setIsChecked((prev) => !prev);
    },
    // Stryker disable next-line ArrayDeclaration: equivalent, deps stay Object.is-equal
    []
  );
  return (
    <Box sx={styles.authOptionsWrapper}>
      <UICheckbox
        label={t('sign_in.form.remember_me')}
        checked={isChecked}
        onChange={handleCheckboxChange}
        sx={styles.rememberMeLabel}
      />

      {showForgotPassword && (
        <UITextLink href={ROUTE_PATHS.passwordRecovery}>
          {t('sign_in.form.forgot_password')}
        </UITextLink>
      )}
    </Box>
  );
}
