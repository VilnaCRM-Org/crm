import { useMemo } from 'react';

import { authActions } from '@auth/stores';
import RegistrationHandlersFactory, {
  type RegistrationHandlerDeps,
  type RegistrationHandlers,
} from '@auth/utils/registration-handlers-factory';

export default function useRegistrationHandlers(
  deps: RegistrationHandlerDeps
): RegistrationHandlers {
  const { setView, setFormKey, lastSubmittedDataRef } = deps;
  const { registerUser, resetRegistration } = authActions;

  return useMemo(
    () =>
      new RegistrationHandlersFactory(
        { setView, setFormKey, lastSubmittedDataRef },
        { registerUser, resetRegistration }
      ).build(),
    [lastSubmittedDataRef, registerUser, resetRegistration, setFormKey, setView]
  );
}
