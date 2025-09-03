import UIForm from '@/components/UIForm';
import useAppDispatch from '@/stores/hooks';
import { useState } from 'react';

import { LoginUserDto } from '@/modules/User/features/Auth/types/Credentials';
import { loginUser } from '@/modules/User/store';

import FormField from '../components/FormField';
import PasswordField from '../components/PasswordField';
import UserOptions from '../components/UserOptions';
import { authForms, fieldIsRequired } from '../constants';
import { validateEmail } from '../Validations';

export default function LoginForm(): JSX.Element {
  const [error, setError] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
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

  return (
    <UIForm<LoginUserDto>
      onSubmit={handleLogin}
      defaultValues={{ email: '', password: '' }}
      error={error}
      isSubmitting={isSubmitting}
      submitLabel={authForms.login.submitButton}
      title={authForms.login.title}
      subtitle={authForms.login.infoText}
    >
      <FormField<LoginUserDto>
        name="email"
        label="E-mail"
        placeholder="vilnaCRM@gmail.com"
        type="email"
        autoComplete="email"
        rules={{ required: fieldIsRequired, validate: validateEmail }}
      />
      <PasswordField<LoginUserDto> mode="login" autoComplete="current-password" />
      <UserOptions />
    </UIForm>
  );
}
