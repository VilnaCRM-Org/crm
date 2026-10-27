import type { JSX } from 'react';

import type { TwoFactorDto } from '@/modules/user/types/user/two-factor-dto';

import useDisableFormProps from '../../hooks/use-disable-form-props';
import useEscapeCancel from '../../hooks/use-escape-cancel';
import type { TwoFactorSettingsProps } from '../../types/two-factor/settings-view';

import CancelButton from './cancel-button';
import ConfirmationForm from './confirmation-form';
import DisableCodeField from './disable-code-field';

export default function DisableView(props: TwoFactorSettingsProps): JSX.Element {
  const form = useDisableFormProps(props);
  const { isSubmitting, callbacks, view } = props;
  useEscapeCancel(callbacks.cancel);

  return (
    <ConfirmationForm<TwoFactorDto>
      form={form}
      isSubmitting={isSubmitting}
      footer={<CancelButton onCancel={callbacks.cancel} />}
    >
      <DisableCodeField view={view} />
    </ConfirmationForm>
  );
}
