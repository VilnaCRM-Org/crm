import { startTransition } from 'react';

import loadLoginForm from '@/modules/User/features/Auth/utils/load-login-form';

import type { AuthMode } from './types';

export const LOAD_LOGIN_ERROR_KEY = 'sign_in.errors.load_failed' as const;

export type LoadLoginErrorKey = typeof LOAD_LOGIN_ERROR_KEY | null;

export type SwitchDeps = {
  isLoadingLogin: boolean;
  mode: AuthMode;
  loginSwitchRequest: { current: number };
  setMode: (m: AuthMode) => void;
  setIsLoadingLogin: (v: boolean) => void;
  setLoadLoginError: (v: LoadLoginErrorKey) => void;
};

export function switchToRegister(deps: SwitchDeps): void {
  const { loginSwitchRequest } = deps;
  loginSwitchRequest.current += 1;
  deps.setLoadLoginError(null);
  deps.setIsLoadingLogin(false);
  deps.setMode('register');
}

function applyLoginSwitchResult(
  deps: SwitchDeps,
  requestId: number,
  outcome: 'loaded' | 'failed'
): void {
  if (requestId !== deps.loginSwitchRequest.current) return;
  if (outcome === 'loaded') startTransition(() => deps.setMode('login'));
  else deps.setLoadLoginError(LOAD_LOGIN_ERROR_KEY);
}

function finishLoginSwitch(deps: SwitchDeps, requestId: number): void {
  if (requestId !== deps.loginSwitchRequest.current) return;
  deps.setIsLoadingLogin(false);
}

export function switchToLogin(deps: SwitchDeps): void {
  if (deps.isLoadingLogin) return;
  const { loginSwitchRequest } = deps;
  loginSwitchRequest.current += 1;
  const requestId = loginSwitchRequest.current;
  deps.setLoadLoginError(null);
  deps.setIsLoadingLogin(true);
  loadLoginForm()
    .then(() => applyLoginSwitchResult(deps, requestId, 'loaded'))
    .catch(() => applyLoginSwitchResult(deps, requestId, 'failed'))
    .finally(() => finishLoginSwitch(deps, requestId));
}
