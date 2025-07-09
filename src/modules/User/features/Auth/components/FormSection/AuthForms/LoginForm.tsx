import UIForm from '@/components/UIForm';
import useAppDispatch from '@/hooks';
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
      const resultAction = await dispatch(loginUser(data));

      if (loginUser.rejected.match(resultAction)) {
        const message = resultAction.payload || 'Unknown error';
        setError(`Login failed: ${message}`);
      }
    } catch (err) {
      setError('An unexpected error occurred');
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
        autoComplete="off"
        rules={{ required: fieldIsRequired, validate: validateEmail }}
      />
      <PasswordField<LoginUserDto> mode="login" />
      <UserOptions />
    </UIForm>
  );
}
