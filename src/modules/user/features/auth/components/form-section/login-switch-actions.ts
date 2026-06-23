import { startTransition } from 'react';

import loginFormLoader from '@auth/utils/load-login-form';

import type { LoadLoginErrorKeyValue, SwitchDeps } from './login-switch-actions.types';

export const LOAD_LOGIN_ERROR_KEY: LoadLoginErrorKeyValue = 'sign_in.errors.load_failed';

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
    loginFormLoader
      .load()
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
