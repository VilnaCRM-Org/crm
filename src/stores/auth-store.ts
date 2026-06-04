import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

import container from '@/config/dependency-injection-config';
import { getPreloadedAuthToken } from '@/stores/preloaded-auth-token';

import AuthStoreActions from './auth-store-actions';
import type { AuthState, AuthStore } from './auth-types';

export type { AuthState, AuthStore } from './auth-types';
export * from './auth-selectors';

const initialState: AuthState = {
  email: '',
  token: getPreloadedAuthToken() ?? null,
  user: null,
  loginLoading: false,
  loginError: null,
  registerLoading: false,
  registerError: null,
  registerRetryable: undefined,
};

export function sanitizeAuthState(state: AuthStore): AuthStore {
  return { ...state, token: state.token ? '[REDACTED]' : null };
}

container.registerSingleton<AuthStoreActions>(AuthStoreActions);

export const useAuthStore = create<AuthStore>()(
  devtools(
    (set) => ({
      ...initialState,

      loginUser: (credentials, signal): Promise<void> =>
        container.resolve(AuthStoreActions).login(set, credentials, signal),

      registerUser: (credentials, signal): Promise<void> =>
        container.resolve(AuthStoreActions).register(set, credentials, signal),

      logout: (): void => set(initialState, false, 'auth/logout'),
      reset: (): void => set(initialState, false, 'auth/reset'),
      resetRegistration: (): void =>
        set(
          { user: null, registerError: null, registerLoading: false, registerRetryable: undefined },
          false,
          'auth/resetRegistration'
        ),
    }),
    { name: 'auth', stateSanitizer: sanitizeAuthState }
  )
);
