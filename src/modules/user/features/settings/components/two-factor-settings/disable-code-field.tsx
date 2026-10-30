import type { JSX } from 'react';
import { useTranslation } from 'react-i18next';

import UIFormField from '@/components/ui-form-field';
import UIServerFieldError from '@/components/ui-server-field-error';
import type { TwoFactorDto } from '@/modules/user/types/user/two-factor-dto';

import useConfirmFieldFocus, { CONFIRM_FIELD_NAME } from '../../hooks/use-confirm-field-focus';
import type { DisableCodeFieldProps } from '../../types/components/two-factor-settings';

const NO_RULES = {};

const FIELD_ERROR_KEYS = new Map([
  ['format', 'settings.two_factor.errors.format'],
  ['invalid_code', 'settings.two_factor.errors.invalid_code'],
]);

export default function DisableCodeField({ view }: DisableCodeFieldProps): JSX.Element {
  const { t } = useTranslation();
  useConfirmFieldFocus(view);
  const key = view.fieldError === null ? undefined : FIELD_ERROR_KEYS.get(view.fieldError);

  return (
    <>
      <UIFormField<TwoFactorDto>
        name={CONFIRM_FIELD_NAME}
        label={t('settings.two_factor.disable.code_label')}
        placeholder=""
        type="text"
        autoComplete="one-time-code"
        rules={NO_RULES}
      />
      <UIServerFieldError
        name={CONFIRM_FIELD_NAME}
        message={key === undefined ? null : t(key)}
        focus={false}
      />
    </>
  );
}
