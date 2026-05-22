import type { SerializedError } from '@reduxjs/toolkit';
import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';

import UIForm from '@/components/ui-form';
import FormField from '@auth/components/form-section/components/form-field';
import PasswordField from '@auth/components/form-section/components/password-field';
import UserOptions from '@auth/components/form-section/components/user-options';
import { createValidators } from '@auth/components/form-section/validations';
import useAuthStore from '@auth/hooks/use-auth-store';
import { LoginUserDto } from '@auth/types/credentials';
import getSubmitLabelKey from '@auth/utils/get-submit-label-key';

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
  const candidates: Array<string | null> = [
    typeof serializedError.message === 'string' && serializedError.message.trim()
      ? serializedError.message
      : null,
    getNestedMessage(error.message),
    getNestedMessage(error.displayMessage),
    getNestedMessage(error.data),
  ];

  return candidates.find((c): c is string => Boolean(c)) ?? 'auth.errors.unknown';
};

export default function LoginForm(): JSX.Element {
  const [error, setError] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { t } = useTranslation();
  const { login } = useAuthStore();

  const handleLogin = useCallback(
    async (data: LoginUserDto): Promise<void> => {
      setIsSubmitting(true);
      setError('');

      try {
        await login(data);
      } catch (err) {
        const message = normalizeLoginErrorMessage(err);
        setError(t('sign_in.errors.login', { reason: t(message) }));
      } finally {
        setIsSubmitting(false);
      }
    },
    [login, t]
  );
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
