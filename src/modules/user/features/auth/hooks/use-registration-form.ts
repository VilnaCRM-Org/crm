import { useEffect, useRef, useState } from 'react';

import { RegistrationView } from '@auth/components/form-section/types';
import { AuthStoreSelectors, useAuthStore } from '@auth/stores';
import { RegisterUserDto } from '@auth/types/credentials';

import useRegistrationHandlers from './use-registration-handlers';
import useRegistrationViewSync from './use-registration-view-sync';

type UseRegistrationFormResult = {
  view: RegistrationView;
  errorText: string;
  formKey: number;
  isSubmitting: boolean;
  handleRegister: (data: RegisterUserDto) => Promise<void>;
  handleSuccessShown: () => void;
  handleBackToForm: () => void;
  handleRetry: () => void;
};

export default function useRegistrationForm(
  onViewChange?: (view: RegistrationView) => void
): UseRegistrationFormResult {
  const user = useAuthStore(AuthStoreSelectors.registerUser);
  const isSubmitting = useAuthStore(AuthStoreSelectors.registerLoading);
  const error = useAuthStore(AuthStoreSelectors.registerError);
  const errorText = error?.displayMessage ?? null;

  const [view, setView] = useState<RegistrationView>('form');
  const [formKey, setFormKey] = useState(0);
  const lastSubmittedDataRef = useRef<RegisterUserDto | null>(null);

  useEffect(() => {
    onViewChange?.(view);
  }, [onViewChange, view]);
  useRegistrationViewSync({ user, error: errorText, isSubmitting, setView });

  const handlers = useRegistrationHandlers({
    setView,
    setFormKey,
    lastSubmittedDataRef,
  });

  return { view, errorText: errorText ?? '', formKey, isSubmitting, ...handlers };
}
