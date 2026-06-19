import type { LoadLoginErrorKey } from './login-switch-actions.types';
import type { AuthMode } from './types';

export interface LoginSwitcher {
  mode: AuthMode;
  isLoadingLogin: boolean;
  loadLoginError: LoadLoginErrorKey;
  setMode: (mode: AuthMode) => void;
  handleSwitcherIntent: () => void;
  handleSwitch: () => void;
}
