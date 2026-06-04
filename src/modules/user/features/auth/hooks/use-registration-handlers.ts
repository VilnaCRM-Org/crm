import { useMemo } from 'react';

import { useAuthStore } from '@auth/stores';
import RegistrationHandlersFactory, {
  type RegistrationHandlerDeps,
  type RegistrationHandlers,
} from '@auth/utils/registration-handlers-factory';

export default function useRegistrationHandlers(
  deps: RegistrationHandlerDeps
): RegistrationHandlers {
  const registerUser = useAuthStore((state) => state.registerUser);
  const resetRegistration = useAuthStore((state) => state.resetRegistration);

  return useMemo(
    () => new RegistrationHandlersFactory(deps, { registerUser, resetRegistration }).build(),
    [deps, registerUser, resetRegistration]
  );
}
