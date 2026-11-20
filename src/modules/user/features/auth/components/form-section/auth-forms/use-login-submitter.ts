import type { TFunction } from 'i18next';
import { type MutableRefObject, useCallback, useEffect, useRef } from 'react';

import type { SignInDto } from '@/modules/user/types/user/sign-in-dto';
import useAuthProviderLoader from '@auth/hooks/use-auth-provider-loader';
import useSignInSubmit from '@auth/hooks/use-sign-in-submit';
import { AuthStoreSelectors, authActions, useAuthState } from '@auth/stores';
import type { AuthError } from '@auth/types/auth-error';
import type { LoginSubmitter } from '@auth/types/auth-forms/use-login-submitter';
import type { SignInRun } from '@auth/types/sign-in/sign-in-run';
import type { SignInFailureReason } from '@auth/types/two-factor/sign-in-failure';

const MESSAGE_KEY_BY_REASON: Record<SignInFailureReason, string> = {
  invalid_credentials: 'sign_in.errors.invalid_credentials',
  locked: 'sign_in.errors.locked',
  rate_limited: 'sign_in.errors.rate_limited',
  transient: 'sign_in.errors.transient',
};

function loginErrorMessage(error: AuthError | null, t: TFunction): string {
  if (error === null) return '';
  return t(MESSAGE_KEY_BY_REASON[error.reason ?? 'transient']);
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
    // Stryker disable next-line ArrayDeclaration: equivalent, deps stay Object.is-equal
    []
  );

  return loginControllersRef;
}

function useAbortableLogin(
  run: SignInRun,
  loginControllersRef: MutableRefObject<Set<AbortController>>
): LoginSubmitter['handleLogin'] {
  return useCallback(
    async (data: SignInDto): Promise<void> => {
      const controller = new AbortController();
      loginControllersRef.current.add(controller);

      try {
        await run(data, controller.signal);
      } finally {
        loginControllersRef.current.delete(controller);
      }
    },
    // Stryker disable next-line ArrayDeclaration: equivalent, deps stay Object.is-equal
    [run, loginControllersRef]
  );
}

export default function useLoginSubmitter(t: TFunction): LoginSubmitter {
  const state = useAuthState();
  const loginControllersRef = useLoginControllers();
  const login = useAbortableLogin(useSignInSubmit(useAuthProviderLoader()), loginControllersRef);
  const lastSubmitted = useRef<SignInDto | null>(null);

  const handleLogin = useCallback(
    (data: SignInDto): Promise<void> => {
      lastSubmitted.current = data;
      return login(data);
    },
    // Stryker disable next-line ArrayDeclaration: equivalent, login is a stable useCallback
    [login]
  );

  const loginError = AuthStoreSelectors.loginError(state);

  return {
    error: loginErrorMessage(loginError, t),
    retryable: loginError?.retryable === true,
    isSubmitting: AuthStoreSelectors.loginLoading(state),
    handleLogin,
    handleRetry: (): void => {
      if (lastSubmitted.current !== null) void login(lastSubmitted.current);
    },
    handleBack: (): void => clearLoginError(loginControllersRef.current),
  };
}
