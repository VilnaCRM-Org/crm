import { useEffect, useRef } from 'react';

import { validateLoginResponse } from '@/modules/User/features/Auth/types/api-responses';
import type { LoginUserDto } from '@/modules/User/features/Auth/types/credentials';
import {
  createValidationUiError,
  isAbortError,
  toUiError,
} from '@/modules/User/features/Auth/utils/auth-request-errors';

type LoginClient = {
  login: (data: LoginUserDto, options?: { signal?: AbortSignal }) => Promise<{ token: string }>;
};

type UseLoginRequestResult = {
  login: (data: LoginUserDto) => Promise<{ email: string; token: string }>;
};

export default function useLoginRequest(loginAPI: LoginClient): UseLoginRequestResult {
  const loginAbortControllerRef = useRef<AbortController | null>(null);

  useEffect(
    (): (() => void) => () => {
      loginAbortControllerRef.current?.abort();
    },
    []
  );

  const login = async (data: LoginUserDto): Promise<{ email: string; token: string }> => {
    loginAbortControllerRef.current?.abort();

    const controller = new AbortController();
    loginAbortControllerRef.current = controller;

    try {
      const apiResponse = await loginAPI.login(data, { signal: controller.signal });
      const parsed = validateLoginResponse(apiResponse);

      if (!parsed.success) {
        throw createValidationUiError(parsed.errors, true, '; ');
      }

      return { ...parsed.data, email: data.email.toLowerCase() };
    } catch (error) {
      if (isAbortError(error)) {
        throw error;
      }

      throw toUiError(error);
    } finally {
      if (loginAbortControllerRef.current === controller) {
        loginAbortControllerRef.current = null;
      }
    }
  };

  return { login };
}
