import UIForm from '@/components/UIForm';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

import FormField from '@/modules/User/features/Auth/components/FormSection/components/FormField';
import PasswordField from '@/modules/User/features/Auth/components/FormSection/components/PasswordField';
import UserOptions from '@/modules/User/features/Auth/components/FormSection/components/UserOptions';
import { createValidators } from '@/modules/User/features/Auth/components/FormSection/Validations';
import {
  selectLoginError,
  selectLoginLoading,
  useAuthStore,
} from '@/modules/User/features/Auth/stores/authStore';
import { LoginUserDto } from '@/modules/User/features/Auth/types/Credentials';
import getSubmitLabelKey from '@/modules/User/features/Auth/utils/getSubmitLabelKey';

export default function LoginForm(): JSX.Element {
  const { t } = useTranslation();
  const loginUser = useAuthStore((state) => state.loginUser);
  const isSubmitting = useAuthStore(selectLoginLoading);
  const storeError = useAuthStore(selectLoginError);

  const error = storeError ? `${t('sign_in.error_prefix')} ${storeError}` : null;

  useEffect(() => (): void => useAuthStore.setState({ loginError: null }), []);

  const handleLogin = async (data: LoginUserDto): Promise<void> => {
    await loginUser(data);
  };

  const validators = createValidators(t);

  return (
    <UIForm<LoginUserDto>
      onSubmit={handleLogin}
      defaultValues={{ email: '', password: '' }}
      error={error}
      isSubmitting={isSubmitting}
      submitLabel={t(getSubmitLabelKey('sign_in', isSubmitting))}
      title={t('sign_in.title')}
      subtitle={t('sign_in.subtitle')}
    >
      <FormField<LoginUserDto>
        name="email"
        label="E-mail"
        placeholder="vilnaCRM@gmail.com"
        type="email"
        autoComplete="email"
        rules={{ required: t('sign_up.form.email_input.required'), validate: validators.email }}
      />
      <PasswordField<LoginUserDto>
        placeholder={t('sign_in.form.password_input.placeholder')}
        label={t('sign_in.form.password_input.label')}
        autoComplete="current-password"
      />
      <UserOptions />
    </UIForm>
  );
}
