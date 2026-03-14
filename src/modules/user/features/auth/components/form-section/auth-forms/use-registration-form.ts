import { useCallback, useEffect, useRef, useState } from 'react';

import { useCreateUser, buildCreateUserInput } from '../../../hooks';
import { RegisterUserDto } from '../../../types/credentials';
import normalizeRegistrationData from '../../../utils/normalize-registration-data';
import type { RegistrationView } from '../types';

import getRegistrationErrorMessage from './registration-error';

type UseRegistrationFormResult = {
  view: RegistrationView;
  notificationErrorText: string;
  formKey: number;
  isSubmitting: boolean;
  emailError: string | null;
  passwordError: string | null;
  nameError: string | null;
  handleRegister: (data: RegisterUserDto) => Promise<boolean>;
  handleBackToForm: () => void;
  handleRetry: () => Promise<void>;
};

export default function useRegistrationForm(
  t: (key: string) => string,
  onViewChange?: (view: RegistrationView) => void
): UseRegistrationFormResult {
  const [createUser, { loading: isSubmitting, error, reset }] = useCreateUser();
  const lastSubmittedDataRef = useRef<RegisterUserDto | null>(null);
  const [view, setView] = useState<RegistrationView>('form');
  const [notificationErrorText, setNotificationErrorText] = useState<string>('');
  const [formKey, setFormKey] = useState(0);

  const { formError, emailError, passwordError, nameError } = getRegistrationErrorMessage(error, t);

  useEffect(() => {
    onViewChange?.(view);
  }, [onViewChange, view]);

  useEffect(() => {
    if (emailError || passwordError || nameError) {
      setView('form');
      setNotificationErrorText('');
    }
  }, [emailError, passwordError, nameError]);

  useEffect(() => {
    if (!formError) return;
    setNotificationErrorText(formError);
    setView('error');
  }, [formError]);

  const handleRegister = useCallback(
    async (data: RegisterUserDto): Promise<boolean> => {
      lastSubmittedDataRef.current = data;
      const normalizedData = normalizeRegistrationData(data);
      const input = buildCreateUserInput(normalizedData);

      try {
        await createUser({ variables: { input } });
        reset();
        setNotificationErrorText('');
        setView('success');
        return true;
      } catch {
        return false;
      }
    },
    [createUser, reset]
  );

  const handleBackToForm = useCallback(() => {
    if (view === 'success') {
      setFormKey((prev) => prev + 1);
    }
    setView('form');
    setNotificationErrorText('');
    lastSubmittedDataRef.current = null;
    reset();
  }, [reset, view]);

  const handleRetry = useCallback(async () => {
    if (!lastSubmittedDataRef.current) return;
    reset();
    await handleRegister(lastSubmittedDataRef.current);
  }, [handleRegister, reset]);

  return {
    view,
    notificationErrorText,
    formKey,
    isSubmitting,
    emailError,
    passwordError,
    nameError,
    handleRegister,
    handleBackToForm,
    handleRetry,
  };
}
