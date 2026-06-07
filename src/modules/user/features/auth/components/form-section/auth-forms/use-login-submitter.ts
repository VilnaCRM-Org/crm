import type { TFunction } from 'i18next';
import { type MutableRefObject, useCallback, useEffect, useRef } from 'react';

import { AuthStoreSelectors, useAuthStore } from '@auth/stores';
import { LoginUserDto } from '@auth/types/credentials';

import LoginErrorMessageNormalizer from './login-error-message';

type LoginSubmitter = {
  error: string;
  isSubmitting: boolean;
  handleLogin: (data: LoginUserDto) => Promise<void>;
};

const I18N_KEY_RE = /^[a-z0-9_]+(?:\.[a-z0-9_]+)+$/i;
const loginErrorMessageNormalizer = new LoginErrorMessageNormalizer();
type LoginUser = (data: LoginUserDto, signal?: AbortSignal) => Promise<void>;

function formatLoginError(raw: string | null, t: TFunction): string {
  if (!raw) return '';
  const normalized = loginErrorMessageNormalizer.normalize(raw);
  const reason = I18N_KEY_RE.test(normalized) ? t(normalized) : normalized;
  return t('sign_in.errors.login', { reason });
}

function clearLoginError(controllers: Set<AbortController>): void {
  for (const controller of controllers) {
    controller.abort();
  }

  controllers.clear();
  useAuthStore.setState({ loginError: null });
}

function useLoginControllers(): MutableRefObject<Set<AbortController>> {
  const loginControllersRef = useRef<Set<AbortController>>(new Set());
  useEffect(
    () => (): void => {
      clearLoginError(loginControllersRef.current);
    },
    []
  );

  return loginControllersRef;
}

function useAbortableLogin(loginUser: LoginUser): LoginSubmitter['handleLogin'] {
  const loginControllersRef = useLoginControllers();

  return useCallback(
    async (data: LoginUserDto): Promise<void> => {
      const controller = new AbortController();
      loginControllersRef.current.add(controller);

      try {
        await loginUser(data, controller.signal);
      } finally {
        loginControllersRef.current.delete(controller);
      }
    },
    [loginControllersRef, loginUser]
  );
}

export default function useLoginSubmitter(t: TFunction): LoginSubmitter {
  const loginUser = useAuthStore((state) => state.loginUser);
  const isSubmitting = useAuthStore(AuthStoreSelectors.loginLoading);
  const rawError = useAuthStore(AuthStoreSelectors.loginError);
  const handleLogin = useAbortableLogin(loginUser);

  return {
    error: formatLoginError(rawError?.displayMessage ?? null, t),
    isSubmitting,
    handleLogin,
  };
}
