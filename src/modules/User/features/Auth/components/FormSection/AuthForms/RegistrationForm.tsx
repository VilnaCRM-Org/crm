import UIForm from '@/components/UIForm';
import useAppDispatch, { useAppSelector } from '@/stores/hooks';
import { useTranslation } from 'react-i18next';

import { RegisterUserDto } from '@/modules/User/features/Auth/types/Credentials';
import { registerUser } from '@/modules/User/store';
import {
  selectRegistrationError,
  selectRegistrationLoading,
} from '@/modules/User/store/registrationSelectors';

import getSubmitLabelKey from '../../../utils/getSubmitLabelKey';
import getRegistrationError from '../../../utils/mapRegistrationError';
import FormField from '../components/FormField';
import PasswordField from '../components/PasswordField';
import { validateEmail, validateFullName } from '../Validations';

export default function RegistrationForm(): JSX.Element {
  const dispatch = useAppDispatch();
  const isSubmitting = useAppSelector(selectRegistrationLoading);
  const rawError = useAppSelector(selectRegistrationError);
  const { t } = useTranslation();

  const errorKey = getRegistrationError(rawError);
  const error = errorKey ? t(errorKey) : null;

  const handleRegister = (data: RegisterUserDto): void => {
    dispatch(registerUser(data));
  };

  return (
    <UIForm<RegisterUserDto>
      onSubmit={handleRegister}
      defaultValues={{ fullName: '', email: '', password: '' }}
      error={error}
      isSubmitting={isSubmitting}
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
        rules={{ required: t('sign_up.form.name_input.required'), validate: validateFullName }}
      />
      <FormField<RegisterUserDto>
        name="email"
        label={t('sign_up.form.email_input.label')}
        placeholder={t('sign_up.form.email_input.placeholder')}
        type="email"
        autoComplete="off"
        rules={{ required: t('sign_up.form.email_input.required'), validate: validateEmail }}
      />

      <PasswordField<RegisterUserDto>
        placeholder={t('sign_up.form.password_input.placeholder')}
        label={t('sign_up.form.password_input.label')}
        autoComplete="off"
      />
    </UIForm>
  );
}
