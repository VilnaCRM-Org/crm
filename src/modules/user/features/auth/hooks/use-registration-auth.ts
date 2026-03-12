import { useEffect, useMemo, useRef, useState } from 'react';

import { createAuthClients } from '@/modules/user/features/auth/repositories';
import {
  validateRegistrationResponse,
  type SafeUserInfo,
} from '@/modules/user/features/auth/types/api-responses';
import type { RegisterUserDto } from '@/modules/user/features/auth/types/credentials';
import { handleAuthError, type UiError } from '@/modules/user/features/auth/utils/handle-auth-error';

type UseRegistrationAuthResult = {
  registrationError: string | null;
  registrationLoading: boolean;
  register: (data: RegisterUserDto) => Promise<SafeUserInfo>;
};

const isAbortError = (error: unknown): boolean =>
  error instanceof Error && error.name === 'AbortError';

const isUiError = (error: unknown): error is UiError =>
  typeof error === 'object' &&
  error !== null &&
  'displayMessage' in error &&
  typeof (error as { displayMessage: unknown }).displayMessage === 'string' &&
  'retryable' in error &&
  typeof (error as { retryable: unknown }).retryable === 'boolean';

export default function useRegistrationAuth(): UseRegistrationAuthResult {
  const registrationAPI = useMemo(() => createAuthClients().registrationAPI, []);
  const registrationAbortControllerRef = useRef<AbortController | null>(null);
  const [registrationError, setRegistrationError] = useState<string | null>(null);
  const [registrationLoading, setRegistrationLoading] = useState(false);

  useEffect(
    (): (() => void) => () => {
      registrationAbortControllerRef.current?.abort();
    },
    []
  );

  const register = async (data: RegisterUserDto): Promise<SafeUserInfo> => {
    registrationAbortControllerRef.current?.abort();

    const controller = new AbortController();
    registrationAbortControllerRef.current = controller;
    setRegistrationLoading(true);
    setRegistrationError(null);

    try {
      const apiResponse = await registrationAPI.register(data, { signal: controller.signal });
      const parsed = validateRegistrationResponse(apiResponse);

      if (!parsed.success) {
        const uiError: UiError = {
          displayMessage: parsed.errors.join('\n'),
          retryable: false,
        };

        setRegistrationError(uiError.displayMessage);
        throw uiError;
      }

      return parsed.data;
    } catch (error) {
      if (isAbortError(error)) {
        throw error;
      }

      const uiError = isUiError(error)
        ? error
        : handleAuthError(error);

      setRegistrationError(uiError.displayMessage);
      throw uiError;
    } finally {
      if (registrationAbortControllerRef.current === controller) {
        registrationAbortControllerRef.current = null;
        setRegistrationLoading(false);
      }
    }
  };

  return {
    registrationError,
    registrationLoading,
    register,
  };
}
