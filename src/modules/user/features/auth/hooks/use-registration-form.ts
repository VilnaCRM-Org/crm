import useAppDispatch, { useAppSelector } from '@/stores/hooks';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { RegistrationView } from '@/modules/user/features/auth/components/form-section/types';
import { RegisterUserDto } from '@/modules/user/features/auth/types/credentials';
import getRegistrationError from '@/modules/user/features/auth/utils/map-registration-error';
import { registerUser, reset } from '@/modules/user/store';
import {
  selectRegistrationError,
  selectRegistrationLoading,
  selectRegistrationUser,
} from '@/modules/user/store/registration-selectors';

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
  const { t } = useTranslation();
  const user = useAppSelector(selectRegistrationUser);
  const loading = useAppSelector(selectRegistrationLoading);
  const error = useAppSelector(selectRegistrationError);
  const errorKey = getRegistrationError(error);

  const [view, setView] = useState<RegistrationView>('form');
  const [formKey, setFormKey] = useState(0);
  const lastSubmittedDataRef = useRef<RegisterUserDto | null>(null);

  useEffect(() => {
    onViewChange?.(view);
  }, [onViewChange, view]);

  useEffect(() => {
    if (user && !loading) {
      setView('success');
    }
  }, [user, loading]);

  useEffect(() => {
    if (error && !loading) {
      setView('error');
    }
  }, [error, loading]);

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

  const isSubmitting = loading || (view === 'form' && (user != null || error != null));

  return {
    view,
    errorText: errorKey ? t(errorKey) : '',
    formKey,
    isSubmitting,
    handleRegister,
    handleSuccessShown,
    handleBackToForm,
    handleRetry,
  };
}
