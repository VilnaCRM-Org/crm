import type { AuthMode } from '@auth/components/form-section/types';

import type { LoadLoginErrorKey } from './login-switch-actions';

export interface LoginSwitcher {
  mode: AuthMode;
  isLoadingLogin: boolean;
  loadLoginError: LoadLoginErrorKey;
  setMode: (mode: AuthMode) => void;
  handleSwitcherIntent: () => void;
  handleSwitch: () => void;
}
