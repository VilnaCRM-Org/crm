import { create, type StoreApi, type UseBoundStore } from 'zustand';
import { devtools } from 'zustand/middleware';

import type { AuthSetState, AuthState, AuthStore } from '../types/auth-store';

import type AuthStoreActions from './auth-store-actions';
import PreloadedAuthToken from './preloaded-auth-token';

export type UseAuthStore = UseBoundStore<StoreApi<AuthStore>>;

const initialState: AuthState = {
  email: '',
  token: PreloadedAuthToken.read() ?? null,
  user: null,
  loginLoading: false,
  loginError: null,
  registerLoading: false,
  registerError: null,
};

export default class AuthStoreFactory {
  public static create(actions: AuthStoreActions): UseAuthStore {
    return create<AuthStore>()(
      devtools((set) => AuthStoreFactory.build(set as AuthSetState, actions), {
        name: 'auth',
        stateSanitizer: AuthStoreFactory.sanitize,
      })
    );
  }

  public static sanitize(state: AuthStore): AuthStore {
    return { ...state, token: state.token ? '[REDACTED]' : null };
  }

  private static build(set: AuthSetState, actions: AuthStoreActions): AuthStore {
    return {
      ...initialState,
      loginUser: (credentials, signal) => actions.login(set, credentials, signal),
      registerUser: (credentials, signal) => actions.register(set, credentials, signal),
      logout: () => set(initialState, false, 'auth/logout'),
      reset: () => set(initialState, false, 'auth/reset'),
      resetRegistration: () =>
        set(
          { user: null, registerError: null, registerLoading: false },
          false,
          'auth/resetRegistration'
        ),
    };
  }
}
