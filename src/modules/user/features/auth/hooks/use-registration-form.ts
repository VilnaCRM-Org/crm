import { useEffect, useRef, useState } from 'react';

import type { RegistrationView } from '@auth/components/form-section/types';
import { AuthStoreSelectors, useAuthState } from '@auth/stores';
import type { RegisterUserDto } from '@auth/types/credentials';
import type { UseRegistrationFormResult } from '@auth/types/registration-form-result';

import useRegistrationHandlers from './use-registration-handlers';
import useRegistrationViewSync from './use-registration-view-sync';

export default function useRegistrationForm(
  onViewChange?: (view: RegistrationView) => void
): UseRegistrationFormResult {
  const state = useAuthState();
  const user = AuthStoreSelectors.registerUser(state);
  const isSubmitting = AuthStoreSelectors.registerLoading(state);
  const error = AuthStoreSelectors.registerError(state);
  const errorText = error?.displayMessage ?? null;
  const showSubmitLoader = isSubmitting || Boolean(user) || Boolean(error);

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

  return { view, errorText: errorText ?? '', formKey, isSubmitting, showSubmitLoader, ...handlers };
}
