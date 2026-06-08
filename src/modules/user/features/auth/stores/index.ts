import container from '@/config/dependency-injection-config';

import type { AuthActions } from '../types/auth-store';

import AuthStoreActions from './auth-store-actions';
import AuthStateVar, { useAuthState } from './auth-var';

const actions = container.resolve(AuthStoreActions);

export const authActions: AuthActions = {
  loginUser: (credentials, signal) => actions.login(credentials, signal),
  registerUser: (credentials, signal) => actions.register(credentials, signal),
  logout: AuthStateVar.reset,
  reset: AuthStateVar.reset,
  resetRegistration: AuthStateVar.resetRegistration,
  clearLoginError: AuthStateVar.clearLoginError,
};

export { default as AuthStoreSelectors } from './auth-store-selectors';
export { AuthStateVar, useAuthState };
export type { AuthState } from '../types/auth-store';
