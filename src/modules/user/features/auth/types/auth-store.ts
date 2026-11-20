import type { SignUpDto } from '@/modules/user/types/user/sign-up-dto';
import type { TwoFactorStatus } from '@/routes/types/protected-outlet-context';

import type { SafeUserInfo } from './api-responses';
import type { AuthError } from './auth-error';

export interface AuthState {
  email: string;
  token: string | null;
  user: SafeUserInfo | null;
  loginLoading: boolean;
  loginError: AuthError | null;
  registerLoading: boolean;
  registerError: AuthError | null;
  twoFactorStatus: TwoFactorStatus;
  pendingSessionId: string | null;
  recoveryCodesRemaining: number | null;
}

export type AuthStatePatch = Partial<AuthState>;

export interface AuthStateWriter {
  setState(patch: AuthStatePatch): void;
}

export interface AuthActions {
  registerUser: (credentials: SignUpDto, signal?: AbortSignal) => Promise<void>;
  logout: () => void;
  reset: () => void;
  resetRegistration: () => void;
  clearLoginError: () => void;
}

export type AuthStore = AuthState & AuthActions;
