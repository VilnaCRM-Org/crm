import { useEffect, useRef, useState, type Dispatch, type SetStateAction } from 'react';

import {
  validateRegistrationResponse,
  type SafeUserInfo,
} from '@/modules/user/features/auth/types/api-responses';
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
  ) => Promise<{ email?: string; fullName?: string } | undefined>;
};

type UseRegistrationRequestResult = {
  registrationError: string | null;
  registrationLoading: boolean;
  register: (data: RegisterUserDto) => Promise<SafeUserInfo>;
};

type SetError = Dispatch<SetStateAction<string | null>>;
type SetLoading = Dispatch<SetStateAction<boolean>>;

type AbortHandle = {
  read: () => AbortController | null;
  set: (controller: AbortController | null) => void;
};

type RegistrationDeps = {
  client: RegistrationClient;
  handle: AbortHandle;
  setError: SetError;
  setLoading: SetLoading;
};

function startRegistrationRequest(deps: RegistrationDeps): AbortController {
  deps.handle.read()?.abort();
  const controller = new AbortController();
  deps.handle.set(controller);
  deps.setLoading(true);
  deps.setError(null);
  return controller;
}

async function performRegistration(
  deps: RegistrationDeps,
  data: RegisterUserDto,
  signal: AbortSignal
): Promise<SafeUserInfo> {
  const apiResponse = await deps.client.register(data, { signal });
  const parsed = validateRegistrationResponse(apiResponse);

  if (parsed.success) {
    return parsed.data;
  }

  const uiError = createValidationUiError(parsed.errors, false, '\n');
  deps.setError(uiError.displayMessage);
  throw uiError;
}

function rethrowRegistrationError(error: unknown, setError: SetError): never {
  if (isAbortError(error)) {
    throw error;
  }
  if (isUiError(error)) {
    setError(error.displayMessage);
    throw error;
  }
  const uiError = toUiError(error);
  setError(uiError.displayMessage);
  throw uiError;
}

function finishRegistrationRequest(deps: RegistrationDeps, controller: AbortController): void {
  if (deps.handle.read() === controller) {
    deps.handle.set(null);
    deps.setLoading(false);
  }
}

async function runRegistration(
  deps: RegistrationDeps,
  data: RegisterUserDto
): Promise<SafeUserInfo> {
  const controller = startRegistrationRequest(deps);
  try {
    return await performRegistration(deps, data, controller.signal);
  } catch (error) {
    return rethrowRegistrationError(error, deps.setError);
  } finally {
    finishRegistrationRequest(deps, controller);
  }
}

export default function useRegistrationRequest(
  registrationAPI: RegistrationClient
): UseRegistrationRequestResult {
  const ref = useRef<AbortController | null>(null);
  const [registrationError, setRegistrationError] = useState<string | null>(null);
  const [registrationLoading, setRegistrationLoading] = useState(false);

  useEffect(
    (): (() => void) => () => {
      ref.current?.abort();
    },
    []
  );

  const deps: RegistrationDeps = {
    client: registrationAPI,
    handle: {
      read: () => ref.current,
      set: (controller) => {
        ref.current = controller;
      },
    },
    setError: setRegistrationError,
    setLoading: setRegistrationLoading,
  };
  const register = (data: RegisterUserDto): Promise<SafeUserInfo> => runRegistration(deps, data);

  return { registrationError, registrationLoading, register };
}
