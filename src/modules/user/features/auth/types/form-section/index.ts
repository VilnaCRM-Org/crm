import type { TFunction } from 'i18next';

import type { AuthMode, RegistrationView } from '@auth/components/form-section/types';

import type { LoadLoginErrorKey } from './login-switch-actions';

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
