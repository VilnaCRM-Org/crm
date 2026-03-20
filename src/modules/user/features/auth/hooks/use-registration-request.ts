import { useEffect, useRef, useState } from 'react';

import { validateRegistrationResponse, type SafeUserInfo } from '@/modules/user/features/auth/types/api-responses';
import type { RegisterUserDto } from '@/modules/user/features/auth/types/credentials';
import {
  createValidationUiError,
  isAbortError,
  isUiError,
  toUiError,
} from '@/modules/user/features/auth/utils/auth-request-errors';

type RegistrationClient = {
  register: (
    data: RegisterUserDto,
    options?: { signal?: AbortSignal }
  ) => Promise<{ email?: string; fullName?: string }>;
};

type UseRegistrationRequestResult = {
  registrationError: string | null;
  registrationLoading: boolean;
  register: (data: RegisterUserDto) => Promise<SafeUserInfo>;
};

export default function useRegistrationRequest(
  registrationAPI: RegistrationClient
): UseRegistrationRequestResult {
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
        const uiError = createValidationUiError(parsed.errors, false, '\n');

        setRegistrationError(uiError.displayMessage);
        throw uiError;
      }

      return parsed.data;
    } catch (error) {
      if (isAbortError(error)) {
        throw error;
      }

      if (isUiError(error)) {
        throw error;
      }

      const uiError = toUiError(error);

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
