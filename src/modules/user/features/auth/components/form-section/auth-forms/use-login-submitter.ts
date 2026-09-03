import type { TFunction } from 'i18next';
import { type MutableRefObject, useCallback, useEffect, useRef } from 'react';

import { AuthStoreSelectors, authActions, useAuthState } from '@auth/stores';
import type { LoginActions, LoginSubmitter } from '@auth/types/auth-forms/use-login-submitter';
import type { LoginUserDto } from '@auth/types/credentials';

import LoginErrorMessageNormalizer from './login-error-message';

const I18N_KEY_SEGMENT_RE = /^[a-z0-9_]+$/i;
const loginErrorMessageNormalizer = new LoginErrorMessageNormalizer();

function isI18nKey(value: string): boolean {
  const segments = value.split('.');
  return segments.length > 1 && segments.every((segment) => I18N_KEY_SEGMENT_RE.test(segment));
}

function formatLoginError(raw: string | null, t: TFunction): string {
  if (!raw) return '';
  const normalized = loginErrorMessageNormalizer.normalize(raw);
  const reason = isI18nKey(normalized) ? t(normalized) : normalized;
  return t('sign_in.errors.login', { reason });
}

function clearLoginError(controllers: Set<AbortController>): void {
  for (const controller of controllers) {
    controller.abort();
  }

  controllers.clear();
  authActions.clearLoginError();
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

function useAbortableLogin(actions: LoginActions): LoginSubmitter['handleLogin'] {
  const loginControllersRef = useLoginControllers();

  return useCallback(
    async (data: LoginUserDto): Promise<void> => {
      const controller = new AbortController();
      loginControllersRef.current.add(controller);

      try {
        await actions.loginUser(data, controller.signal);
      } finally {
        loginControllersRef.current.delete(controller);
      }
    },
    [actions, loginControllersRef]
  );
}

export default function useLoginSubmitter(t: TFunction): LoginSubmitter {
  const state = useAuthState();
  const isSubmitting = AuthStoreSelectors.loginLoading(state);
  const rawError = AuthStoreSelectors.loginError(state);
  const handleLogin = useAbortableLogin(authActions);

  return {
    error: formatLoginError(rawError?.displayMessage ?? null, t),
    isSubmitting,
    handleLogin,
  };
}
