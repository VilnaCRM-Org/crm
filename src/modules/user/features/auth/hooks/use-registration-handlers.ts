import { useMemo } from 'react';

import { useAuthStore } from '@auth/stores';
import RegistrationHandlersFactory, {
  type RegistrationHandlerDeps,
  type RegistrationHandlers,
} from '@auth/utils/registration-handlers-factory';

export default function useRegistrationHandlers(
  deps: RegistrationHandlerDeps
): RegistrationHandlers {
  const { setView, setFormKey, lastSubmittedDataRef } = deps;
  const registerUser = useAuthStore((state) => state.registerUser);
  const resetRegistration = useAuthStore((state) => state.resetRegistration);

  return useMemo(
    () =>
      new RegistrationHandlersFactory(
        { setView, setFormKey, lastSubmittedDataRef },
        { registerUser, resetRegistration }
      ).build(),
    [lastSubmittedDataRef, registerUser, resetRegistration, setFormKey, setView]
  );
}
