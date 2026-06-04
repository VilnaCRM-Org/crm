import type { SafeUserInfo } from '@auth/types/api-responses';
import type { LoginUserDto, RegisterUserDto } from '@auth/types/credentials';

export interface AuthState {
  email: string;
  token: string | null;
  user: SafeUserInfo | null;
  loginLoading: boolean;
  loginError: string | null;
  registerLoading: boolean;
  registerError: string | null;
  registerRetryable?: boolean;
}

export interface AuthActions {
  loginUser: (credentials: LoginUserDto, signal?: AbortSignal) => Promise<void>;
  registerUser: (credentials: RegisterUserDto, signal?: AbortSignal) => Promise<void>;
  logout: () => void;
  reset: () => void;
  resetRegistration: () => void;
}

export type AuthStore = AuthState & AuthActions;
