import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

import { login } from '../api/login';
import type { LoginUserDto } from '../types/Credentials';

interface AuthState {
  email: string;
  token: string | null;
  loading: boolean;
  error: string | null;
}

interface AuthActions {
  loginUser: (credentials: LoginUserDto, signal?: AbortSignal) => Promise<void>;
  logout: () => void;
  reset: () => void;
}

type AuthStore = AuthState & AuthActions;

const initialState: AuthState = {
  email: '',
  token: null,
  loading: false,
  error: null,
};

export const useAuthStore = create<AuthStore>()(
  devtools(
    (set) => ({
      ...initialState,

      loginUser: async (credentials: LoginUserDto, signal?: AbortSignal): Promise<void> => {
        set({ loading: true, error: null }, false, 'auth/loginUser/pending');

        const result = await login(credentials, signal);

        if (result.status === 'aborted') {
          set({ loading: false }, false, 'auth/loginUser/aborted');
        } else if (result.status === 'error') {
          set({ loading: false, error: result.message }, false, 'auth/loginUser/rejected');
        } else {
          set(
            { loading: false, email: result.email, token: result.token, error: null },
            false,
            'auth/loginUser/fulfilled'
          );
        }
      },

      logout: (): void => {
        set(initialState, false, 'auth/logout');
      },

      reset: (): void => {
        set(initialState, false, 'auth/reset');
      },
    }),
    { name: 'auth' }
  )
);

// Selectors
export const selectEmail = (state: AuthStore): string => state.email;
export const selectToken = (state: AuthStore): string | null => state.token;
export const selectLoading = (state: AuthStore): boolean => state.loading;
export const selectError = (state: AuthStore): string | null => state.error;
export const selectIsAuthenticated = (state: AuthStore): boolean => !!state.token;
