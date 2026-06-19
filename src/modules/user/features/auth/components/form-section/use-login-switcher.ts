import { useCallback, useRef, useState } from 'react';

import loadLoginForm from '@auth/utils/load-login-form';

import LoginSwitchController from './login-switch-actions';
import type { LoadLoginErrorKey, SwitchDeps } from './login-switch-actions.types';
import type { AuthMode } from './types';
import type { LoginSwitcher } from './use-login-switcher.types';

export type { LoadLoginErrorKey } from './login-switch-actions.types';

export default function useLoginSwitcher(): LoginSwitcher {
  const [isLoadingLogin, setIsLoadingLogin] = useState(false);
  const [loadLoginError, setLoadLoginError] = useState<LoadLoginErrorKey>(null);
  const [mode, setMode] = useState<AuthMode>('register');
  const loginSwitchRequest = useRef(0);

  const handleSwitcherIntent = useCallback(() => {
    if (mode === 'register') loadLoginForm().catch(() => undefined);
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
