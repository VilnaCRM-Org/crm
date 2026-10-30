import type { JSX } from 'react';
import type { FieldValues } from 'react-hook-form';

import useEscapeCancel from '../../hooks/use-escape-cancel';
import useRegenerateFormProps from '../../hooks/use-regenerate-form-props';
import type { TwoFactorSettingsProps } from '../../types/two-factor/settings-view';

import CancelButton from './cancel-button';
import ConfirmationForm from './confirmation-form';

export default function RegenerateView(props: TwoFactorSettingsProps): JSX.Element {
  const form = useRegenerateFormProps(props);
  const { isSubmitting, callbacks } = props;
  useEscapeCancel(callbacks.cancel);

  return (
    <ConfirmationForm<FieldValues>
      form={form}
      isSubmitting={isSubmitting}
      footer={<CancelButton onCancel={callbacks.cancel} />}
    >
      {null}
    </ConfirmationForm>
  );
}
