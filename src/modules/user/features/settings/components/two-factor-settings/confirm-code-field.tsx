import type { JSX } from 'react';
import { useFormContext } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import UIPinInput from '@/components/ui-pin-input';
import type { TwoFactorDto } from '@/modules/user/types/user/two-factor-dto';

import useConfirmFieldFocus, { CONFIRM_FIELD_NAME } from '../../hooks/use-confirm-field-focus';
import type { ConfirmCodeFieldProps } from '../../types/components/two-factor-settings';

const CELL_COUNT = 6;
const NO_RULES = {};

const FIELD_ERROR_KEYS = new Map([
  ['incomplete', 'settings.two_factor.errors.incomplete'],
  ['invalid_code', 'settings.two_factor.errors.invalid_code'],
]);

export default function ConfirmCodeField({ view, disabled }: ConfirmCodeFieldProps): JSX.Element {
  const { t } = useTranslation();
  const { control } = useFormContext<TwoFactorDto>();
  useConfirmFieldFocus(view);
  const key = view.fieldError === null ? undefined : FIELD_ERROR_KEYS.get(view.fieldError);

  return (
    <UIPinInput<TwoFactorDto>
      control={control}
      name={CONFIRM_FIELD_NAME}
      rules={NO_RULES}
      label={t('settings.two_factor.confirm.code_label')}
      cellLabel={(position: number): string =>
        t('settings.two_factor.confirm.cell_label', { position, total: CELL_COUNT })
      }
      error={key !== undefined}
      helperText={key === undefined ? undefined : t(key)}
      disabled={disabled}
    />
  );
}
