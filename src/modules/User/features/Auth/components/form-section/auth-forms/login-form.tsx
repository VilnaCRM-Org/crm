import UIForm from '@/components/UIForm';
import useAppDispatch from '@/stores/hooks';
import type { SerializedError } from '@reduxjs/toolkit';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import FormField from '@/modules/User/features/Auth/components/form-section/components/form-field';
import PasswordField from '@/modules/User/features/Auth/components/form-section/components/password-field';
import UserOptions from '@/modules/User/features/Auth/components/form-section/components/user-options';
import { createValidators } from '@/modules/User/features/Auth/components/form-section/validations';
import { LoginUserDto } from '@/modules/User/features/Auth/types/Credentials';
import getSubmitLabelKey from '@/modules/User/features/Auth/utils/getSubmitLabelKey';
import { loginUser } from '@/modules/User/store';

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const getNestedMessage = (value: unknown): string | null => {
  if (typeof value === 'string' && value.trim()) return value;
  if (!isRecord(value)) return null;

  const nestedMessage = value.message;
  if (typeof nestedMessage === 'string' && nestedMessage.trim()) return nestedMessage;

  return null;
};

export const normalizeLoginErrorMessage = (error: unknown): string => {
  if (typeof error === 'string' && error.trim()) return error;
  if (error instanceof Error && error.message.trim()) return error.message;
  if (!isRecord(error)) return 'auth.errors.unknown';

  const serializedError = error as SerializedError;
  if (typeof serializedError.message === 'string' && serializedError.message.trim()) {
    return serializedError.message;
  }

  const directMessage = getNestedMessage(error.message);
  if (directMessage) return directMessage;

  const displayMessage = getNestedMessage(error.displayMessage);
  if (displayMessage) return displayMessage;

  const dataMessage = getNestedMessage(error.data);
  if (dataMessage) return dataMessage;

  return 'auth.errors.unknown';
};

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
      const message = normalizeLoginErrorMessage(err);
      setError(`${t('sign_in.errors.login')}: ${t(message)}`);
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
        label={t('sign_in.form.email_input.label')}
        placeholder={t('sign_in.form.email_input.placeholder')}
        type="email"
        autoComplete="email"
        rules={{ required: t('sign_in.form.email_input.required'), validate: validators.email }}
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
