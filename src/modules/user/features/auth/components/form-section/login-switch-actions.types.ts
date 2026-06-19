import type { AuthMode } from './types';

export type LoadLoginErrorKeyValue = 'sign_in.errors.load_failed';
export type LoadLoginErrorKey = LoadLoginErrorKeyValue | null;

export interface SwitchDeps {
  isLoadingLogin: boolean;
  mode: AuthMode;
  loginSwitchRequest: { current: number };
  setMode: (m: AuthMode) => void;
  setIsLoadingLogin: (v: boolean) => void;
  setLoadLoginError: (v: LoadLoginErrorKey) => void;
}
