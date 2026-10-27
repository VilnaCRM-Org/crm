import type { TFunction } from 'i18next';
import { type MutableRefObject, useCallback, useEffect, useRef } from 'react';

import type { SignInDto } from '@/modules/user/types/user/sign-in-dto';
import useAuthProviderLoader from '@auth/hooks/use-auth-provider-loader';
import useSignInSubmit from '@auth/hooks/use-sign-in-submit';
import { AuthStoreSelectors, authActions, useAuthState } from '@auth/stores';
import type { AuthError, AuthErrorKind } from '@auth/types/auth-error';
import type { LoginSubmitter } from '@auth/types/auth-forms/use-login-submitter';
import type { SignInRun } from '@auth/types/sign-in/sign-in-run';

const UNEXPECTED_ERROR_KEY = 'failure_responses.client_errors.unexpected_error';
const RATE_LIMITED_KEY = 'sign_in.errors.rate_limited';
const RATE_LIMITED_STATUS = 429;

const MESSAGE_KEY_BY_KIND = new Map<AuthErrorKind, string>([
  ['authentication', 'sign_in.errors.invalid_credentials'],
  ['network', 'failure_responses.network_errors.network_error'],
  ['server', 'failure_responses.server_errors.server_error'],
  ['validation', 'failure_responses.client_errors.something_went_wrong'],
]);

function loginErrorMessage(error: AuthError | null, t: TFunction): string {
  if (error === null) return '';
  if (error.status === RATE_LIMITED_STATUS) return t(RATE_LIMITED_KEY);
  return t(MESSAGE_KEY_BY_KIND.get(error.kind) ?? UNEXPECTED_ERROR_KEY);
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

  return {
    error: loginErrorMessage(AuthStoreSelectors.loginError(state), t),
    isSubmitting: AuthStoreSelectors.loginLoading(state),
    handleLogin,
    handleRetry: (): void => {
      if (lastSubmitted.current !== null) void login(lastSubmitted.current);
    },
    handleBack: (): void => clearLoginError(loginControllersRef.current),
  };
}
