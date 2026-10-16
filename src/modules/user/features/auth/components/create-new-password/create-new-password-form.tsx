import { type JSX, useEffect } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import type { PasswordRuleViewSet } from '@/components/types/ui-password-policy-rules';
import UIForm from '@/components/ui-form';
import UIPasswordField from '@/components/ui-password-field';
import UIPasswordPolicyRules from '@/components/ui-password-policy-rules';
import UIServerFieldError from '@/components/ui-server-field-error';
import passwordValidator from '@/modules/user/lib/validations/password';
import fieldStyles from '@auth/components/form-section/components/styles';
import useRecoveryFailureBanner from '@auth/hooks/use-recovery-failure-banner';
import type {
  CreateNewPasswordFieldsProps,
  CreateNewPasswordFormProps,
} from '@auth/types/password-recovery/components';
import type { CreateNewPasswordFormValues } from '@auth/types/password-recovery/forms';

const RULES_ID = 'new-password-rules';

const evaluateNewPassword = (value: string): PasswordRuleViewSet =>
  passwordValidator.evaluate(value);

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

function ConfirmPasswordField(): JSX.Element {
  const { t } = useTranslation();

  return (
    <UIPasswordField<CreateNewPasswordFormValues>
      name="confirmPassword"
      label={t('password_reset.confirm_password.label')}
      placeholder={t('password_reset.confirm_password.placeholder')}
      autoComplete="new-password"
      sx={fieldStyles.formFieldWrapper}
      rules={{
        required: t('sign_up.form.password_input.required'),
        validate: (value, values) =>
          value === values.newPassword || t('password_reset.errors.mismatch'),
      }}
    />
  );
}

function CreateNewPasswordFields({ failure }: CreateNewPasswordFieldsProps): JSX.Element {
  const { t } = useTranslation();
  const policyRejected =
    failure?.reason === 'policy_rejected' ? t('password_reset.errors.policy_rejected') : null;

  return (
    <>
      <UIPasswordField<CreateNewPasswordFormValues>
        name="newPassword"
        label={t('password_reset.new_password.label')}
        placeholder={t('password_reset.new_password.placeholder')}
        autoComplete="new-password"
        describedBy={RULES_ID}
        sx={fieldStyles.formFieldWrapper}
        rules={{
          required: t('sign_up.form.password_input.required'),
          validate: passwordValidator.createChecklistGate<CreateNewPasswordFormValues>(t),
        }}
      />
      <UIPasswordPolicyRules id={RULES_ID} name="newPassword" evaluate={evaluateNewPassword} />
      <ConfirmPasswordField />
      <UIServerFieldError name="newPassword" message={policyRejected} />
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
      submitLabel={t('password_recovery.submit_button')}
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
