import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

import container from '@/config/DependencyInjectionConfig';
import TOKENS from '@/config/tokens';
import type LoginAPI from '@/modules/User/features/Auth/api/LoginAPI';
import { LoginResponseSchema } from '@/modules/User/features/Auth/types/ApiResponses';
import { LoginUserDto } from '@/modules/User/features/Auth/types/Credentials';
import { ErrorHandler } from '@/services/error';
import { ErrorParser } from '@/utils/error';

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

        try {
          const loginAPI = container.resolve<LoginAPI>(TOKENS.LoginAPI);
          const apiResponse = await loginAPI.login(credentials, { signal });
          const parsed = LoginResponseSchema.safeParse(apiResponse);

          if (!parsed.success) {
            const displayMessage = parsed.error.issues.map((i) => i.message).join('; ');
            set(
              { loading: false, error: displayMessage },
              false,
              'auth/loginUser/rejected'
            );
            return;
          }

          set(
            {
              loading: false,
              email: credentials.email.toLowerCase(),
              token: parsed.data.token,
              error: null,
            },
            false,
            'auth/loginUser/fulfilled'
          );
        } catch (err) {
          const parsedError = ErrorParser.parseHttpError(err);
          const apiError = ErrorHandler.handleAuthError(parsedError);

          set(
            { loading: false, error: apiError.displayMessage },
            false,
            'auth/loginUser/rejected'
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
