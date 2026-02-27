import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

import { login } from '../api/login';
import { register } from '../api/register';
import type { LoginUserDto, RegisterUserDto } from '../types/Credentials';

interface AuthState {
  email: string;
  token: string | null;
  loginLoading: boolean;
  loginError: string | null;
  registerLoading: boolean;
  registerError: string | null;
}

interface AuthActions {
  loginUser: (credentials: LoginUserDto, signal?: AbortSignal) => Promise<void>;
  registerUser: (credentials: RegisterUserDto, signal?: AbortSignal) => Promise<void>;
  logout: () => void;
  reset: () => void;
}

type AuthStore = AuthState & AuthActions;

const initialState: AuthState = {
  email: '',
  token: null,
  loginLoading: false,
  loginError: null,
  registerLoading: false,
  registerError: null,
};

export function sanitizeAuthState(state: AuthStore): AuthStore {
  return {
    ...state,
    token: state.token ? '[REDACTED]' : null,
  };
}

export const useAuthStore = create<AuthStore>()(
  devtools(
    (set) => ({
      ...initialState,

      loginUser: async (credentials: LoginUserDto, signal?: AbortSignal): Promise<void> => {
        set({ loginLoading: true, loginError: null }, false, 'auth/loginUser/pending');

        const result = await login(credentials, signal);

        if (result.status === 'aborted') {
          set({ loginLoading: false }, false, 'auth/loginUser/aborted');
        } else if (result.status === 'error') {
          set(
            { loginLoading: false, loginError: result.message },
            false,
            'auth/loginUser/rejected'
          );
        } else {
          set(
            { loginLoading: false, email: result.email, token: result.token, loginError: null },
            false,
            'auth/loginUser/fulfilled'
          );
        }
      },

      registerUser: async (credentials: RegisterUserDto, signal?: AbortSignal): Promise<void> => {
        set({ registerLoading: true, registerError: null }, false, 'auth/registerUser/pending');

        const result = await register(credentials, signal);

        if (result.status === 'aborted') {
          set({ registerLoading: false }, false, 'auth/registerUser/aborted');
        } else if (result.status === 'error') {
          set(
            { registerLoading: false, registerError: result.message },
            false,
            'auth/registerUser/rejected'
          );
        } else {
          set(
            { registerLoading: false, registerError: null },
            false,
            'auth/registerUser/fulfilled'
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
    { name: 'auth', stateSanitizer: sanitizeAuthState }
  )
);

// Selectors
export const selectEmail = (state: AuthStore): string => state.email;
export const selectToken = (state: AuthStore): string | null => state.token;
export const selectLoginLoading = (state: AuthStore): boolean => state.loginLoading;
export const selectLoginError = (state: AuthStore): string | null => state.loginError;
export const selectRegisterLoading = (state: AuthStore): boolean => state.registerLoading;
export const selectRegisterError = (state: AuthStore): string | null => state.registerError;
export const selectIsAuthenticated = (state: AuthStore): boolean => !!state.token;
