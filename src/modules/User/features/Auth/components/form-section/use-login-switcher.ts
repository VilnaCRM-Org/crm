import { useCallback, useRef, useState } from 'react';

import loadLoginForm from '@/modules/User/features/Auth/utils/load-login-form';

import {
  switchToLogin,
  switchToRegister,
  type LoadLoginErrorKey,
  type SwitchDeps,
} from './login-switch-actions';
import type { AuthMode } from './types';

export type { LoadLoginErrorKey } from './login-switch-actions';

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
    if (mode === 'login') switchToRegister(deps);
    else switchToLogin(deps);
  }, [isLoadingLogin, mode]);

  return { mode, isLoadingLogin, loadLoginError, setMode, handleSwitcherIntent, handleSwitch };
}
