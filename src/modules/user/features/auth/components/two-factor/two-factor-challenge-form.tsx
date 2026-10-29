import type { JSX } from 'react';

import UIForm from '@/components/ui-form';
import type { TwoFactorDto } from '@/modules/user/types/user/two-factor-dto';
import useChallengeFormProps from '@auth/hooks/use-challenge-form-props';
import type { TwoFactorChallengeProps } from '@auth/types/two-factor/challenge-view';

import ChallengeCodeField from './challenge-code-field';
import RecoveryCodeField from './recovery-code-field';

export default function TwoFactorChallengeForm(props: TwoFactorChallengeProps): JSX.Element {
  const form = useChallengeFormProps(props);
  const { state } = props;

  return (
    <UIForm<TwoFactorDto>
      onSubmit={form.onSubmit}
      defaultValues={form.defaultValues}
      error={form.error}
      errorAction={form.errorAction}
      errorOccurrence={form.errorOccurrence}
      submitRef={form.submitRef}
      isSubmitting={state.isSubmitting}
      submitLabel={form.submitLabel}
      submittingLabel={form.submittingLabel}
      title={form.title}
      titleComponent="h1"
      titleRef={form.titleRef}
      subtitle={form.subtitle}
      footer={form.footer}
      notice={form.notice}
    >
      {state.mode === 'totp' ? (
        <ChallengeCodeField state={state} />
      ) : (
        <RecoveryCodeField state={state} />
      )}
    </UIForm>
  );
}
