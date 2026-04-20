import { startTransition } from 'react';

import loadLoginForm from '@/modules/User/features/Auth/utils/load-login-form';

import type { AuthMode } from './types';

export const LOAD_LOGIN_ERROR_KEY = 'sign_in.errors.load_failed' as const;

export type LoadLoginErrorKey = typeof LOAD_LOGIN_ERROR_KEY | null;

export type SwitchDeps = {
  isLoadingLogin: boolean;
  mode: AuthMode;
  setMode: (m: AuthMode) => void;
  setIsLoadingLogin: (v: boolean) => void;
  setLoadLoginError: (v: LoadLoginErrorKey) => void;
};

export function switchToRegister(deps: SwitchDeps): void {
  deps.setLoadLoginError(null);
  deps.setMode('register');
}

export function switchToLogin(deps: SwitchDeps): void {
  if (deps.isLoadingLogin) return;
  deps.setLoadLoginError(null);
  deps.setIsLoadingLogin(true);
  loadLoginForm()
    .then(() => startTransition(() => deps.setMode('login')))
    .catch(() => deps.setLoadLoginError(LOAD_LOGIN_ERROR_KEY))
    .finally(() => deps.setIsLoadingLogin(false));
}
