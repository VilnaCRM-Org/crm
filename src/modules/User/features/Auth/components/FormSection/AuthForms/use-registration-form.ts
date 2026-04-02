import useAppDispatch, { useAppSelector } from '@/stores/hooks';
import { useCallback, useEffect, useRef, useState } from 'react';

import { registerUser, reset } from '@/modules/User/store';
import {
  selectRegistrationError,
  selectRegistrationLoading,
  selectRegistrationUser,
} from '@/modules/User/store/registrationSelectors';

import { RegisterUserDto } from '../../../types/Credentials';
import { RegistrationView } from '../types';

type UseRegistrationFormResult = {
  view: RegistrationView;
  errorText: string;
  formKey: number;
  isSubmitting: boolean;
  handleRegister: (data: RegisterUserDto) => void;
  handleSuccessShown: () => void;
  handleBackToForm: () => void;
  handleRetry: () => void;
};

export default function useRegistrationForm(
  onViewChange?: (view: RegistrationView) => void
): UseRegistrationFormResult {
  const dispatch = useAppDispatch();
  const user = useAppSelector(selectRegistrationUser);
  const isSubmitting = useAppSelector(selectRegistrationLoading);
  const error = useAppSelector(selectRegistrationError);

  const [view, setView] = useState<RegistrationView>('form');
  const [formKey, setFormKey] = useState(0);
  const lastSubmittedDataRef = useRef<RegisterUserDto | null>(null);

  useEffect(() => {
    onViewChange?.(view);
  }, [onViewChange, view]);

  useEffect(() => {
    if (!isSubmitting) {
      if (user) {
        setView('success');
      } else if (error) {
        setView('error');
      }
    }
  }, [user, error, isSubmitting]);

  const handleRegister = useCallback(
    (data: RegisterUserDto): void => {
      const normalized = { ...data, fullName: data.fullName.trim() };
      lastSubmittedDataRef.current = normalized;
      dispatch(registerUser(normalized));
    },
    [dispatch]
  );

  const handleBackToForm = useCallback((): void => {
    setView('form');
    dispatch(reset());
    lastSubmittedDataRef.current = null;
  }, [dispatch]);

  const handleSuccessShown = useCallback((): void => {
    setFormKey((prev) => prev + 1);
  }, []);

  const handleRetry = useCallback((): void => {
    if (!lastSubmittedDataRef.current) return;
    dispatch(reset());
    dispatch(registerUser(lastSubmittedDataRef.current));
  }, [dispatch]);

  return {
    view,
    errorText: error ?? '',
    formKey,
    isSubmitting,
    handleRegister,
    handleSuccessShown,
    handleBackToForm,
    handleRetry,
  };
}
