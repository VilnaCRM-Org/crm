import { useEffect, useRef } from 'react';

import { validateLoginResponse } from '@/modules/user/features/auth/types/api-responses';
import type { LoginUserDto } from '@/modules/user/features/auth/types/credentials';
import {
  createValidationUiError,
  isAbortError,
  toUiError,
} from '@/modules/user/features/auth/utils/auth-request-errors';

type LoginClient = {
  login: (
    data: LoginUserDto,
    options?: { signal?: AbortSignal }
  ) => Promise<{ token: string } | undefined>;
};

type LoginResult = { email: string; token: string };

type UseLoginRequestResult = {
  login: (data: LoginUserDto) => Promise<LoginResult>;
};

type AbortHandle = {
  read: () => AbortController | null;
  set: (controller: AbortController | null) => void;
};

function startRequest(handle: AbortHandle): AbortController {
  handle.read()?.abort();
  const controller = new AbortController();
  handle.set(controller);
  return controller;
}

function finishRequest(handle: AbortHandle, controller: AbortController): void {
  if (handle.read() === controller) {
    handle.set(null);
  }
}

async function performLogin(
  loginAPI: LoginClient,
  data: LoginUserDto,
  signal: AbortSignal
): Promise<LoginResult> {
  const apiResponse = await loginAPI.login(data, { signal });
  const parsed = validateLoginResponse(apiResponse);

  if (!parsed.success) {
    throw createValidationUiError(parsed.errors, true, '; ');
  }

  return { ...parsed.data, email: data.email.toLowerCase() };
}

function rethrowLoginError(error: unknown): never {
  if (isAbortError(error)) {
    throw error;
  }
  throw toUiError(error);
}

async function runLogin(
  loginAPI: LoginClient,
  handle: AbortHandle,
  data: LoginUserDto
): Promise<LoginResult> {
  const controller = startRequest(handle);
  try {
    return await performLogin(loginAPI, data, controller.signal);
  } catch (error) {
    return rethrowLoginError(error);
  } finally {
    finishRequest(handle, controller);
  }
}

export default function useLoginRequest(loginAPI: LoginClient): UseLoginRequestResult {
  const ref = useRef<AbortController | null>(null);
  const handle: AbortHandle = {
    read: () => ref.current,
    set: (controller) => {
      ref.current = controller;
    },
  };

  useEffect(
    (): (() => void) => () => {
      ref.current?.abort();
    },
    []
  );

  return { login: (data: LoginUserDto) => runLogin(loginAPI, handle, data) };
}
