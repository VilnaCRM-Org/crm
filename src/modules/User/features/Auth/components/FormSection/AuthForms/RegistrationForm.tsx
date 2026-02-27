import UIForm from '@/components/UIForm';
import { selectError, selectLoading, useAuthStore } from '@/modules/User/features/Auth/stores/authStore';
import { useTranslation } from 'react-i18next';

import FormField from '@/modules/User/features/Auth/components/FormSection/components/FormField';
import PasswordField from '@/modules/User/features/Auth/components/FormSection/components/PasswordField';
import { createValidators } from '@/modules/User/features/Auth/components/FormSection/Validations';
import { RegisterUserDto } from '@/modules/User/features/Auth/types/Credentials';
import getSubmitLabelKey from '@/modules/User/features/Auth/utils/getSubmitLabelKey';
import getRegistrationError from '@/modules/User/features/Auth/utils/mapRegistrationError';

export default function RegistrationForm(): JSX.Element {
  const registerUser = useAuthStore((state) => state.registerUser);
  const isSubmitting = useAuthStore(selectLoading);
  const rawError = useAuthStore(selectError);
  const { t } = useTranslation();

  const errorKey = getRegistrationError(rawError);
  const error = errorKey ? t(errorKey) : null;

  const handleRegister = async (data: RegisterUserDto): Promise<void> => {
    await registerUser(data);
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
