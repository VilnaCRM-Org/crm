import UIForm from '@/components/UIForm';
import useAppDispatch from '@/hooks';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { RegisterUserDto } from '@/modules/User/features/Auth/types/Credentials';
import isAPIError from '@/modules/User/helpers/isAPIError';
import { registerUser } from '@/modules/User/store';

import FormField from '../components/FormField';
import PasswordField from '../components/PasswordField';
import { fieldIsRequired, EMAIL_ALREADY_USED, GENERIC_SIGNUP_ERROR } from '../constants';
import { validateEmail, validateFullName } from '../Validations';

export default function RegistrationForm(): JSX.Element {
  const [error, setError] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const dispatch = useAppDispatch();
  const { t } = useTranslation();

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
      submitLabel={t('sign_up.form.button_text')}
      title={t('sign_up.title')}
      subtitle={t('sign_up.subtitle')}
    >
      <FormField<RegisterUserDto>
        name="fullName"
        label={t('sign_up.form.name_input.label')}
        placeholder={t('sign_up.form.name_input.placeholder')}
        type="text"
        autoComplete="off"
        rules={{ required: fieldIsRequired, validate: validateFullName }}
      />
      <FormField<RegisterUserDto>
        name="email"
        label={t('sign_up.form.email_input.label')}
        placeholder={t('sign_up.form.email_input.placeholder')}
        type="email"
        autoComplete="off"
        rules={{ required: fieldIsRequired, validate: validateEmail }}
      />
      <PasswordField<RegisterUserDto> mode="register" />
    </UIForm>
  );
}
