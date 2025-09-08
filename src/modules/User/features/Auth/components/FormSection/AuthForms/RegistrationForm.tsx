import UIForm from '@/components/UIForm';
import useAppDispatch, { useAppSelector } from '@/stores/hooks';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { RegisterUserDto } from '@/modules/User/features/Auth/types/Credentials';
import { registerUser } from '@/modules/User/store';
import {
  selectRegistrationError,
  selectRegistrationLoading,
} from '@/modules/User/store/registrationSelectors';

import FormField from '../components/FormField';
import PasswordField from '../components/PasswordField';
import { EMAIL_ALREADY_USED, fieldIsRequired, GENERIC_SIGNUP_ERROR } from '../constants';
import { validateEmail, validateFullName } from '../Validations';

export default function RegistrationForm(): JSX.Element {
  const dispatch = useAppDispatch();
  const isSubmitting = useAppSelector(selectRegistrationLoading);
  const { t } = useTranslation();
  const rawError = useAppSelector(selectRegistrationError);

  const error = useMemo(() => {
    if (!rawError) return null;
    if (rawError.includes('email') || rawError.includes('exists')) {
      return EMAIL_ALREADY_USED;
    }
    return GENERIC_SIGNUP_ERROR;
  }, [rawError]);

  const handleRegister = (data: RegisterUserDto): void => {
    dispatch(registerUser(data));
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

      <PasswordField<RegisterUserDto> mode="register" autoComplete="off" />
    </UIForm>
  );
}
