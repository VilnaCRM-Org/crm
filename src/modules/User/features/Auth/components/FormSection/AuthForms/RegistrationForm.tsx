import UIForm from '@/components/UIForm';
import useAppDispatch from '@/hooks';
import { useState } from 'react';

import { RegisterUserDto } from '@/modules/User/features/Auth/types/Credentials';
import isAPIError from '@/modules/User/helpers/isAPIError';
import { registerUser } from '@/modules/User/store';

import FormField from '../components/FormField';
import PasswordField from '../components/PasswordField';
import { authForms, fieldIsRequired, EMAIL_ALREADY_USED, GENERIC_SIGNUP_ERROR } from '../constants';
import { validateEmail, validateFullName } from '../Validations';

export default function RegistrationForm(): JSX.Element {
  const [error, setError] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const dispatch = useAppDispatch();

  const handleRegister = async (data: RegisterUserDto): Promise<void> => {
    setIsSubmitting(true);
    setError('');

    try {
      await dispatch(registerUser(data)).unwrap();
    } catch (err) {
      if (isAPIError(err)) {
        setError(
          err.code === 'EMAIL_EXISTS' || err.code === 'DUPLICATE_EMAIL'
            ? EMAIL_ALREADY_USED
            : GENERIC_SIGNUP_ERROR
        );
      } else {
        const message = err instanceof Error ? err.message : String(err);
        setError(
          message.includes('email') || message.includes('exists')
            ? EMAIL_ALREADY_USED
            : GENERIC_SIGNUP_ERROR
        );
      }
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
    </UIForm>
  );
}
