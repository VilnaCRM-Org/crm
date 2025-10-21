import UIForm from '@/components/UIForm';
import useAppDispatch from '@/stores/hooks';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { LoginUserDto } from '@/modules/User/features/Auth/types/Credentials';
import { loginUser } from '@/modules/User/store';

import getSubmitLabelKey from '../../../utils/getSubmitLabelKey';
import FormField from '../components/FormField';
import PasswordField from '../components/PasswordField';
import UserOptions from '../components/UserOptions';
import { createValidators } from '../Validations';

export default function LoginForm(): JSX.Element {
  const [error, setError] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { t } = useTranslation();
  const dispatch = useAppDispatch();

  const handleLogin = async (data: LoginUserDto): Promise<void> => {
    setIsSubmitting(true);
    setError('');

    try {
      await dispatch(loginUser(data)).unwrap();
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
