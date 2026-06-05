import { create, type StateCreator, type StoreApi, type UseBoundStore } from 'zustand';
import { devtools } from 'zustand/middleware';

import type { AuthSetState, AuthState, AuthStore } from '../types/auth-store';

import type AuthStoreActions from './auth-store-actions';
import PreloadedAuthToken from './preloaded-auth-token';

export type UseAuthStore = UseBoundStore<StoreApi<AuthStore>>;

function createClearedState(): AuthState {
  return {
    email: '',
    token: null,
    user: null,
    loginLoading: false,
    loginError: null,
    registerLoading: false,
    registerError: null,
  };
}

const initialState: AuthState = {
  ...createClearedState(),
  token: PreloadedAuthToken.read() ?? null,
};

export default class AuthStoreFactory {
  public static create(actions: AuthStoreActions): UseAuthStore {
    function createState(set: AuthSetState): AuthStore {
      return AuthStoreFactory.build(set as AuthSetState, actions);
    }

    if (process.env.NODE_ENV === 'production') {
      return create<AuthStore>()(createState as unknown as StateCreator<AuthStore>);
    }

    return create<AuthStore>()(
      devtools(
        createState as unknown as StateCreator<AuthStore, [], [['zustand/devtools', never]]>,
        {
          name: 'auth',
          stateSanitizer: AuthStoreFactory.sanitize,
        }
      )
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
      logout: () => set(createClearedState(), false, 'auth/logout'),
      reset: () => set(createClearedState(), false, 'auth/reset'),
      resetRegistration: () =>
        set(
          { user: null, registerError: null, registerLoading: false },
          false,
          'auth/resetRegistration'
        ),
    };
  }
}
