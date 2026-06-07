import type { SafeUserInfo } from './api-responses';
import type { AuthError } from './auth-error';
import type { LoginUserDto, RegisterUserDto } from './credentials';

export interface AuthState {
  email: string;
  token: string | null;
  user: SafeUserInfo | null;
  loginLoading: boolean;
  loginError: AuthError | null;
  registerLoading: boolean;
  registerError: AuthError | null;
}

export interface AuthActions {
  loginUser: (credentials: LoginUserDto, signal?: AbortSignal) => Promise<void>;
  registerUser: (credentials: RegisterUserDto, signal?: AbortSignal) => Promise<void>;
  logout: () => void;
  reset: () => void;
  resetRegistration: () => void;
}

export type AuthStore = AuthState & AuthActions;

export type AuthSetState = (partial: Partial<AuthState>, replace?: false, action?: string) => void;
