import UIForm from '@/components/ui-form';
import { useTranslation } from 'react-i18next';

import { RegisterUserDto } from '@/modules/user/features/auth/types/credentials';

import useRegistrationAuth from '@/modules/user/features/auth/hooks/use-registration-auth';
import getSubmitLabelKey from '@/modules/user/features/auth/utils/get-submit-label-key';
import getRegistrationError from '@/modules/user/features/auth/utils/map-registration-error';
import FormField from '../components/form-field';
import PasswordField from '../components/password-field';
import { createValidators } from '../validations';

export default function RegistrationForm(): JSX.Element {
  const { register, registrationLoading: isSubmitting, registrationError: rawError } =
    useRegistrationAuth();
  const { t } = useTranslation();

  const errorKey = getRegistrationError(rawError);
  const error = errorKey ? t(errorKey) : null;

  const handleRegister = async (data: RegisterUserDto): Promise<void> => {
    await register(data);
  };
  const validators = createValidators(t);
  return (
    <UIForm<RegisterUserDto>
      onSubmit={handleRegister}
      defaultValues={{ fullName: '', email: '', password: '' }}
      error={error}
      isSubmitting={isSubmitting}
      resetOnSuccess
      submitLabel={t(getSubmitLabelKey('sign_up', isSubmitting))}
      title={t('sign_up.title')}
      subtitle={t('sign_up.subtitle')}
    >
      <FormField<RegisterUserDto>
        name="fullName"
        label={t('sign_up.form.name_input.label')}
        placeholder={t('sign_up.form.name_input.placeholder')}
        type="text"
        autoComplete="off"
        rules={{ required: t('sign_up.form.name_input.required'), validate: validators.fullName }}
      />
      <FormField<RegisterUserDto>
        name="email"
        label={t('sign_up.form.email_input.label')}
        placeholder={t('sign_up.form.email_input.placeholder')}
        type="email"
        autoComplete="off"
        rules={{ required: t('sign_up.form.email_input.required'), validate: validators.email }}
      />

      <PasswordField<RegisterUserDto>
        placeholder={t('sign_up.form.password_input.placeholder')}
        label={t('sign_up.form.password_input.label')}
        autoComplete="off"
      />
    </UIForm>
  );
}
