import { useEffect, useRef, useState } from 'react';

import useAppDispatch, { useAppSelector } from '@/stores/hooks';

import {
  selectRegistrationError,
  selectRegistrationLoading,
  selectRegistrationUser,
} from '@/modules/user/store/registration-selectors';
import { RegistrationView } from '@auth/components/form-section/types';
import { RegisterUserDto } from '@auth/types/credentials';

import useRegistrationHandlers from './use-registration-handlers';
import useRegistrationViewSync from './use-registration-view-sync';

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
  const loading = useAppSelector(selectRegistrationLoading);
  const error = useAppSelector(selectRegistrationError);

  const [view, setView] = useState<RegistrationView>('form');
  const [formKey, setFormKey] = useState(0);
  const lastSubmittedDataRef = useRef<RegisterUserDto | null>(null);

  useEffect(() => {
    onViewChange?.(view);
  }, [onViewChange, view]);

  const isSubmitting = loading;

  useRegistrationViewSync({ user, error, isSubmitting, setView });

  const handlers = useRegistrationHandlers({
    dispatch,
    setView,
    setFormKey,
    lastSubmittedDataRef,
  });

  return { view, errorText: error ?? '', formKey, isSubmitting, ...handlers };
}
