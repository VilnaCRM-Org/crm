import type { JSX } from 'react';
import { useFormContext } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import UIPinInput from '@/components/ui-pin-input';
import type { TwoFactorFieldError } from '@/modules/user/types/two-factor/code';
import type { TwoFactorDto } from '@/modules/user/types/user/two-factor-dto';
import useChallengeFieldSync, { CODE_FIELD_NAME } from '@auth/hooks/use-challenge-field-sync';
import type { ChallengeCodeFieldProps } from '@auth/types/two-factor/challenge-components';

const CELL_COUNT = 6;
const NO_RULES = {};

const FIELD_ERROR_KEYS: Record<TwoFactorFieldError, string> = {
  incomplete: 'two_factor.errors.incomplete',
  format: 'two_factor.errors.format',
  invalid_code: 'two_factor.errors.invalid_code',
};

export default function ChallengeCodeField({ state }: ChallengeCodeFieldProps): JSX.Element {
  const { t } = useTranslation();
  const { control } = useFormContext<TwoFactorDto>();
  const { fieldError, isSubmitting } = state;
  useChallengeFieldSync(state);

  return (
    <UIPinInput<TwoFactorDto>
      control={control}
      name={CODE_FIELD_NAME}
      rules={NO_RULES}
      label={t('two_factor.code_label')}
      cellLabel={(position: number): string =>
        t('two_factor.cell_label', { position, total: CELL_COUNT })
      }
      error={fieldError !== null}
      helperText={fieldError === null ? undefined : t(FIELD_ERROR_KEYS[fieldError])}
      disabled={isSubmitting}
    />
  );
}
