import UIForm from '@/components/UIForm';
import useAppDispatch from '@/hooks';
import { useState } from 'react';

import { RegisterUserDto } from '@/modules/User/features/Auth/types/Credentials';
import { registerUser } from '@/modules/User/store';

import FormField from '../components/FormField';
import PasswordField from '../components/PasswordField';
import UserOptions from '../components/UserOptions';
import { authForms, fieldIsRequired } from '../constants';
import { validateEmail, validateFullName } from '../Validations';

export default function RegistrationForm(): JSX.Element {
  const [error, setError] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const dispatch = useAppDispatch();

  const handleRegister = async (data: RegisterUserDto): Promise<void> => {
    setIsSubmitting(true);
    setError('');

    try {
      const resultAction = await dispatch(registerUser(data));

      if (registerUser.rejected.match(resultAction)) {
        const message = resultAction.payload || 'Unknown error';
        setError(`Registration failed: ${message}`);
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <UIForm<RegisterUserDto>
      onSubmit={handleRegister}
      defaultValues={{ fullName: '', email: '', password: '' }}
      error={error}
      isSubmitting={isSubmitting}
      submitLabel={authForms.register.submitButton}
      title={authForms.register.title}
      subtitle={authForms.register.infoText}
    >
      <FormField<RegisterUserDto>
        name="fullName"
        label="Ваше ім'я та прізвище"
        placeholder="Михайло Светський"
        type="text"
        autoComplete="off"
        rules={{ required: fieldIsRequired, validate: validateFullName }}
      />
      <FormField<RegisterUserDto>
        name="email"
        label="E-mail"
        placeholder="vilnaCRM@gmail.com"
        type="email"
        autoComplete="off"
        rules={{ required: fieldIsRequired, validate: validateEmail }}
      />
      <PasswordField<RegisterUserDto> mode="register" />
      <UserOptions />
    </UIForm>
  );
}
