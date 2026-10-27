import { type JSX, useState } from 'react';
import type { FieldValues } from 'react-hook-form';

import UIForm from '@/components/ui-form';

import useCodesFormProps from '../../hooks/use-codes-form-props';
import type { TwoFactorSettingsProps } from '../../types/two-factor/settings-view';

import CodesBlock from './codes-block';
import SavedCheckbox from './saved-checkbox';

export default function CodesView(props: TwoFactorSettingsProps): JSX.Element {
  const [saved, setSaved] = useState(false);
  const form = useCodesFormProps(props, saved);
  const { recoveryCodes } = props.settings;

  return (
    <UIForm<FieldValues>
      onSubmit={form.onSubmit}
      defaultValues={form.defaultValues}
      isSubmitting={props.isSubmitting}
      title={form.title}
      titleComponent="h3"
      titleRef={form.titleRef}
      subtitle={form.subtitle}
      submitLabel={form.submitLabel}
      submittingLabel={form.submittingLabel}
      submitBlockedReason={form.submitBlockedReason}
    >
      {recoveryCodes !== null && <CodesBlock codes={recoveryCodes} />}
      <SavedCheckbox checked={saved} onChange={(event) => setSaved(event.target.checked)} />
    </UIForm>
  );
}
