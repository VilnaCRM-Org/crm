import { useEffect, useMemo, useRef, useState } from 'react';

import { createAuthClients } from '../repositories';
import {
  validateLoginResponse,
  validateRegistrationResponse,
  type SafeUserInfo,
} from '../types/api-responses';
import type { LoginUserDto, RegisterUserDto } from '../types/credentials';
import { handleAuthError, type UiError } from '../utils/handle-auth-error';

type UseAuthStoreResult = {
  registrationError: string | null;
  registrationLoading: boolean;
  register: (data: RegisterUserDto) => Promise<SafeUserInfo>;
  login: (data: LoginUserDto) => Promise<{ email: string; token: string }>;
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

export default function useAuthStore(): UseAuthStoreResult {
  const { loginAPI, registrationAPI } = useMemo(() => createAuthClients(), []);
  const loginAbortControllerRef = useRef<AbortController | null>(null);
  const registrationAbortControllerRef = useRef<AbortController | null>(null);
  const [registrationError, setRegistrationError] = useState<string | null>(null);
  const [registrationLoading, setRegistrationLoading] = useState(false);

  useEffect(
    (): (() => void) => () => {
      loginAbortControllerRef.current?.abort();
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

  const login = async (data: LoginUserDto): Promise<{ email: string; token: string }> => {
    loginAbortControllerRef.current?.abort();

    const controller = new AbortController();
    loginAbortControllerRef.current = controller;

    try {
      const apiResponse = await loginAPI.login(data, { signal: controller.signal });
      const parsed = validateLoginResponse(apiResponse);

      if (!parsed.success) {
        const uiError: UiError = {
          displayMessage: parsed.errors.join('; '),
          retryable: true,
        };

        throw uiError;
      }

      return { email: data.email.toLowerCase(), ...parsed.data };
    } catch (error) {
      if (isAbortError(error)) {
        throw error;
      }

      const uiError = isUiError(error)
        ? error
        : handleAuthError(error);

      throw uiError;
    } finally {
      if (loginAbortControllerRef.current === controller) {
        loginAbortControllerRef.current = null;
      }
    }
  };

  return {
    registrationError,
    registrationLoading,
    register,
    login,
  };
}
