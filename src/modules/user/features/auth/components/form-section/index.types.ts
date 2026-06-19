import type { TFunction } from 'i18next';

import type { AuthMode, RegistrationView } from './types';
import type { LoadLoginErrorKey } from './use-login-switcher';

export type FormSectionLayoutProps = {
  mode: AuthMode;
  registrationView: RegistrationView;
  onRegistrationViewChange: (view: RegistrationView) => void;
  isLoadingLogin: boolean;
  loadLoginError: LoadLoginErrorKey;
  onSwitch: () => void;
  onIntent: () => void;
  t: TFunction;
};
