import { startTransition } from 'react';

import loadLoginForm from '@auth/utils/load-login-form';

import type { AuthMode } from './types';

export const LOAD_LOGIN_ERROR_KEY = 'sign_in.errors.load_failed' as const;

export type LoadLoginErrorKey = typeof LOAD_LOGIN_ERROR_KEY | null;

export interface SwitchDeps {
  isLoadingLogin: boolean;
  mode: AuthMode;
  loginSwitchRequest: { current: number };
  setMode: (m: AuthMode) => void;
  setIsLoadingLogin: (v: boolean) => void;
  setLoadLoginError: (v: LoadLoginErrorKey) => void;
}

export default class LoginSwitchController {
  constructor(private readonly deps: SwitchDeps) {}

  public switchToRegister(): void {
    const { deps } = this;
    deps.loginSwitchRequest.current += 1;
    deps.setLoadLoginError(null);
    deps.setIsLoadingLogin(false);
    deps.setMode('register');
  }

  public switchToLogin(): void {
    const { deps } = this;
    if (deps.isLoadingLogin) return;
    deps.loginSwitchRequest.current += 1;
    const requestId = deps.loginSwitchRequest.current;
    deps.setLoadLoginError(null);
    deps.setIsLoadingLogin(true);
    loadLoginForm()
      .then(() => this.applyLoginSwitchResult(requestId, 'loaded'))
      .catch(() => this.applyLoginSwitchResult(requestId, 'failed'))
      .finally(() => this.finishLoginSwitch(requestId));
  }

  private applyLoginSwitchResult(requestId: number, outcome: 'loaded' | 'failed'): void {
    const { deps } = this;
    if (requestId !== deps.loginSwitchRequest.current) return;
    if (outcome === 'loaded') startTransition(() => deps.setMode('login'));
    else deps.setLoadLoginError(LOAD_LOGIN_ERROR_KEY);
  }

  private finishLoginSwitch(requestId: number): void {
    const { deps } = this;
    if (requestId !== deps.loginSwitchRequest.current) return;
    deps.setIsLoadingLogin(false);
  }
}
