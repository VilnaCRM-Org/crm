import { type JSX, useEffect } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import UIForm from '@/components/ui-form';
import PasswordField from '@auth/components/form-section/components/password-field';
import PasswordPolicyRules from '@auth/components/form-section/components/password-policy-rules';
import ServerFieldError from '@auth/components/form-section/components/server-field-error';
import passwordValidator from '@auth/components/form-section/validations/password';
import useRecoveryFailureBanner from '@auth/hooks/use-recovery-failure-banner';
import type {
  CreateNewPasswordFieldsProps,
  CreateNewPasswordFormProps,
} from '@auth/types/password-recovery/components';
import type { CreateNewPasswordFormValues } from '@auth/types/password-recovery/forms';

const RULES_ID = 'new-password-rules';

function ConfirmationRecheck(): null {
  const { trigger, getFieldState, formState } = useFormContext<CreateNewPasswordFormValues>();
  // Stryker disable next-line ObjectLiteral: equivalent, confirm edits already self-revalidate
  const newPassword = useWatch<CreateNewPasswordFormValues>({ name: 'newPassword' });
  const armed = formState.isSubmitted || getFieldState('confirmPassword', formState).isTouched;

  useEffect(() => {
    if (armed) void trigger('confirmPassword');
  }, [armed, newPassword, trigger]);

  return null;
}

function CreateNewPasswordFields({ failure }: CreateNewPasswordFieldsProps): JSX.Element {
  const { t } = useTranslation();
  const policyRejected =
    failure?.reason === 'policy_rejected' ? t('password_reset.errors.policy_rejected') : null;

  return (
    <>
      <PasswordField<CreateNewPasswordFormValues>
        name="newPassword"
        label={t('password_reset.new_password.label')}
        placeholder={t('password_reset.new_password.placeholder')}
        autoComplete="new-password"
        describedBy={RULES_ID}
        rules={{
          required: t('sign_up.form.password_input.required'),
          validate: passwordValidator.createChecklistGate<CreateNewPasswordFormValues>(t),
        }}
      />
      <PasswordPolicyRules id={RULES_ID} name="newPassword" />
      <PasswordField<CreateNewPasswordFormValues>
        name="confirmPassword"
        label={t('password_reset.confirm_password.label')}
        placeholder={t('password_reset.confirm_password.placeholder')}
        autoComplete="new-password"
        rules={{
          required: t('sign_up.form.password_input.required'),
          validate: (value, values) =>
            value === values.newPassword || t('password_reset.errors.mismatch'),
        }}
      />
      <ServerFieldError name="newPassword" message={policyRejected} />
      <ConfirmationRecheck />
    </>
  );
}

export default function CreateNewPasswordForm({
  token,
  onSubmit,
  onDismissFailure,
  failure,
  isSubmitting,
}: CreateNewPasswordFormProps): JSX.Element {
  const { t } = useTranslation();
  const banner = useRecoveryFailureBanner(failure, onDismissFailure);

  return (
    <UIForm<CreateNewPasswordFormValues>
      onSubmit={onSubmit}
      defaultValues={{ token, newPassword: '', confirmPassword: '' }}
      error={banner.error}
      isSubmitting={isSubmitting}
      submitLabel={banner.retry ? t('auth.error.tryAgain') : t('password_recovery.submit_button')}
      submittingLabel={t('password_reset.submitting')}
      title={t('password_reset.title')}
      titleComponent="h1"
      submitSpacing="tight"
      subtitle={t('password_reset.body')}
    >
      <CreateNewPasswordFields failure={failure} />
    </UIForm>
  );
}
