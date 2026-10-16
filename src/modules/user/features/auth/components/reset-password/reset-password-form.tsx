import type { JSX } from 'react';
import { useTranslation } from 'react-i18next';

import UIForm from '@/components/ui-form';
import UIFormField from '@/components/ui-form-field';
import UIServerFieldError from '@/components/ui-server-field-error';
import formValidators from '@/modules/user/lib/validations';
import type { RestorePasswordDto } from '@/modules/user/types/user/restore-password-dto';
import useFocusOnMount from '@/utils/use-focus-on-mount';
import fieldStyles from '@auth/components/form-section/components/styles';
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
      <UIFormField<RestorePasswordDto>
        name="email"
        label={t('sign_in.form.email_input.label')}
        placeholder={t('sign_in.form.email_input.placeholder')}
        type="email"
        autoComplete="email"
        rules={{ validate: formValidators.create(t).email }}
        sx={fieldStyles.formFieldWrapper}
      />
      <UIServerFieldError name="email" message={emailRejected} />
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
