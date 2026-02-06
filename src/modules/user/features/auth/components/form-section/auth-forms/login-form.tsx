import UIForm from '@/components/ui-form';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { LoginUserDto } from '@/modules/user/features/auth/types/credentials';

import useLogin from '../../../hooks/use-login';
import getSubmitLabelKey from '../../../utils/get-submit-label-key';
import FormField from '../components/form-field';
import PasswordField from '../components/password-field';
import UserOptions from '../components/user-options';
import { createValidators } from '../validations';

export default function LoginForm(): JSX.Element {
  const [error, setError] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { t } = useTranslation();
  const { login } = useLogin();

  const handleLogin = async (data: LoginUserDto): Promise<void> => {
    setIsSubmitting(true);
    setError('');

    try {
      await login(data);
    } catch (err) {
      const message = (err as string) || 'auth.errors.unknown';
      // TODO: replace hardcoded keys/strings with actual `t()` calls when keys are added
      setError(`Помилка входу: ${message}`);
    } finally {
      setIsSubmitting(false);
    }
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
