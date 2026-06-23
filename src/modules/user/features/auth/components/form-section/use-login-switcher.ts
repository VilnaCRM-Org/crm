import { useCallback, useRef, useState } from 'react';

import type { LoadLoginErrorKey, SwitchDeps } from '@auth/types/form-section/login-switch-actions';
import type { LoginSwitcher } from '@auth/types/form-section/use-login-switcher';
import loginFormLoader from '@auth/utils/load-login-form';

import LoginSwitchController from './login-switch-actions';
import type { AuthMode } from './types';

export type { LoadLoginErrorKey } from '@auth/types/form-section/login-switch-actions';

export default function useLoginSwitcher(): LoginSwitcher {
  const [isLoadingLogin, setIsLoadingLogin] = useState(false);
  const [loadLoginError, setLoadLoginError] = useState<LoadLoginErrorKey>(null);
  const [mode, setMode] = useState<AuthMode>('register');
  const loginSwitchRequest = useRef(0);

  const handleSwitcherIntent = useCallback(() => {
    if (mode === 'register') loginFormLoader.load().catch(() => undefined);
  }, [mode]);

  const handleSwitch = useCallback(() => {
    const deps: SwitchDeps = {
      isLoadingLogin,
      mode,
      loginSwitchRequest,
      setMode,
      setIsLoadingLogin,
      setLoadLoginError,
    };
    const controller = new LoginSwitchController(deps);
    if (mode === 'login') controller.switchToRegister();
    else controller.switchToLogin();
  }, [isLoadingLogin, mode]);

  return { mode, isLoadingLogin, loadLoginError, setMode, handleSwitcherIntent, handleSwitch };
}
