import { useCallback, useRef, useState } from 'react';

import LoginSwitchController, {
  type LoadLoginErrorKey,
  type SwitchDeps,
} from '@auth/components/form-section/login-switch-actions';
import type { AuthMode } from '@auth/components/form-section/types';
import loadLoginForm from '@auth/utils/load-login-form';

export type { LoadLoginErrorKey } from '@auth/components/form-section/login-switch-actions';

export interface LoginSwitcher {
  mode: AuthMode;
  isLoadingLogin: boolean;
  loadLoginError: LoadLoginErrorKey;
  setMode: (mode: AuthMode) => void;
  handleSwitcherIntent: () => void;
  handleSwitch: () => void;
}

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
