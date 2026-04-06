import UIForm from '@/components/UIForm';
import useAppDispatch, { useAppSelector } from '@/stores/hooks';
import { useTranslation } from 'react-i18next';

import FormField from '@/modules/User/features/Auth/components/form-section/components/form-field';
import PasswordField from '@/modules/User/features/Auth/components/form-section/components/password-field';
import { RegistrationView } from '@/modules/User/features/Auth/components/form-section/types';
import { createValidators } from '@/modules/User/features/Auth/components/form-section/validations';
import { RegisterUserDto } from '@/modules/User/features/Auth/types/Credentials';
import getSubmitLabelKey from '@/modules/User/features/Auth/utils/getSubmitLabelKey';
import getRegistrationError from '@/modules/User/features/Auth/utils/mapRegistrationError';
import { registerUser } from '@/modules/User/store';
import {
  selectRegistrationError,
  selectRegistrationLoading,
} from '@/modules/User/store/registrationSelectors';


type RegistrationFormProps = {
  onViewChange?: (view: RegistrationView) => void;
};

export default function RegistrationForm({ onViewChange }: RegistrationFormProps): JSX.Element {
  const dispatch = useAppDispatch();
  const isSubmitting = useAppSelector(selectRegistrationLoading);
  const rawError = useAppSelector(selectRegistrationError);
  const { t } = useTranslation();

  const errorKey = getRegistrationError(rawError);
  const error = errorKey ? t(errorKey) : null;

  const handleRegister = (data: RegisterUserDto): void => {
    onViewChange?.('form');
    dispatch(registerUser(data));
  };
  const validators = createValidators(t);
  return (
    <UIForm<RegisterUserDto>
      onSubmit={handleRegister}
      defaultValues={{ fullName: '', email: '', password: '' }}
      error={error}
      isSubmitting={isSubmitting}
      resetOnSuccess
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
        rules={{ required: t('sign_up.form.name_input.required'), validate: validators.fullName }}
      />
      <FormField<RegisterUserDto>
        name="email"
        label={t('sign_up.form.email_input.label')}
        placeholder={t('sign_up.form.email_input.placeholder')}
        type="email"
        autoComplete="off"
        rules={{ required: t('sign_up.form.email_input.required'), validate: validators.email }}
      />

      <PasswordField<RegisterUserDto>
        placeholder={t('sign_up.form.password_input.placeholder')}
        label={t('sign_up.form.password_input.label')}
        autoComplete="off"
      />
    </UIForm>
  );
}
