import type { JSX } from 'react';
import { useTranslation } from 'react-i18next';

import UIForm from '@/components/ui-form';
import type { RestorePasswordDto } from '@/modules/user/types/user/restore-password-dto';
import useFocusOnMount from '@/utils/use-focus-on-mount';
import FormField from '@auth/components/form-section/components/form-field';
import ServerFieldError from '@auth/components/form-section/components/server-field-error';
import formValidators from '@auth/components/form-section/validations';
import useRecoveryFailureBanner from '@auth/hooks/use-recovery-failure-banner';
import type {
  ResetPasswordEmailFieldProps,
  ResetPasswordFormProps,
} from '@auth/types/password-recovery/components';

function EmailField({ failure }: ResetPasswordEmailFieldProps): JSX.Element {
  const { t } = useTranslation();
  const emailRejected =
    failure?.reason === 'invalid_email' ? t('password_recovery.errors.email_rejected') : null;

  return (
    <>
      <FormField<RestorePasswordDto>
        name="email"
        label={t('sign_in.form.email_input.label')}
        placeholder={t('sign_in.form.email_input.placeholder')}
        type="email"
        autoComplete="email"
        rules={{ validate: formValidators.create(t).email }}
      />
      <ServerFieldError name="email" message={emailRejected} />
    </>
  );
}

export default function ResetPasswordForm({
  defaultValues,
  onSubmit,
  onDismissFailure,
  failure,
  isSubmitting,
  focusTitle,
}: ResetPasswordFormProps): JSX.Element {
  const { t } = useTranslation();
  const focusOnMount = useFocusOnMount<HTMLElement>();
  const banner = useRecoveryFailureBanner(failure, onDismissFailure);

  return (
    <UIForm<RestorePasswordDto>
      onSubmit={onSubmit}
      defaultValues={defaultValues}
      error={banner.error}
      isSubmitting={isSubmitting}
      submitLabel={t('password_recovery.submit_button')}
      submittingLabel={t('password_recovery.submitting')}
      title={t('password_recovery.title')}
      titleComponent="h1"
      submitSpacing="tight"
      titleRef={focusTitle ? focusOnMount : undefined}
      subtitle={t('password_recovery.body')}
    >
      <EmailField failure={failure} />
    </UIForm>
  );
}
