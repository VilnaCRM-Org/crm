import { Grid } from '@mui/material';
import type { JSX } from 'react';
import { useFormContext } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import UIFormInputField from '@/components/ui-form-input-field';
import UIServerFieldError from '@/components/ui-server-field-error';
import UITypography from '@/components/ui-typography';
import type { TwoFactorFieldError } from '@/modules/user/types/two-factor/code';
import type { TwoFactorDto } from '@/modules/user/types/user/two-factor-dto';
import useChallengeFieldSync, { CODE_FIELD_NAME } from '@auth/hooks/use-challenge-field-sync';
import type { RecoveryCodeFieldProps } from '@auth/types/two-factor/challenge-components';

import styles from './styles';

const NO_RULES = {};
const HTML_INPUT = { autoCapitalize: 'characters', spellCheck: false, autoComplete: 'off' };

const FIELD_ERROR_KEYS: Record<TwoFactorFieldError, string> = {
  incomplete: 'two_factor.errors.recovery_format',
  format: 'two_factor.errors.recovery_format',
  invalid_code: 'two_factor.errors.recovery_invalid',
};

export default function RecoveryCodeField({ state }: RecoveryCodeFieldProps): JSX.Element {
  const { t } = useTranslation();
  const { control } = useFormContext<TwoFactorDto>();
  const { fieldError, isSubmitting } = state;
  useChallengeFieldSync(state);

  return (
    <Grid container sx={styles.recoveryField}>
      <UITypography component="label" htmlFor={CODE_FIELD_NAME} sx={styles.recoveryLabel}>
        {t('two_factor.recovery.label')}
      </UITypography>
      <UIFormInputField<TwoFactorDto>
        control={control}
        rules={NO_RULES}
        defaultValue=""
        name={CODE_FIELD_NAME}
        id={CODE_FIELD_NAME}
        fullWidth
        disabled={isSubmitting}
        helperText={t('two_factor.recovery.helper')}
        sx={styles.recoveryInput}
        slotProps={{ htmlInput: HTML_INPUT }}
      />
      <UIServerFieldError
        name={CODE_FIELD_NAME}
        message={fieldError === null ? null : t(FIELD_ERROR_KEYS[fieldError])}
        focus={false}
      />
    </Grid>
  );
}
