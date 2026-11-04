import { type JSX, useState } from 'react';
import type { FieldValues } from 'react-hook-form';

import useCodesFormProps from '../../hooks/use-codes-form-props';
import type { TwoFactorSettingsProps } from '../../types/two-factor/settings-view';

import CodesBlock from './codes-block';
import ConfirmationForm from './confirmation-form';
import SavedCheckbox from './saved-checkbox';

export default function CodesView(props: TwoFactorSettingsProps): JSX.Element {
  const [saved, setSaved] = useState(false);
  const form = useCodesFormProps(props, saved);
  const { recoveryCodes } = props.settings;

  return (
    <ConfirmationForm<FieldValues> form={form} isSubmitting={props.isSubmitting}>
      {recoveryCodes !== null && <CodesBlock codes={recoveryCodes} />}
      <SavedCheckbox checked={saved} onChange={(event) => setSaved(event.target.checked)} />
    </ConfirmationForm>
  );
}
