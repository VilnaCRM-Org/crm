import type { SignInDto } from '@/modules/user/types/user/sign-in-dto';
import type { SignUpDto } from '@/modules/user/types/user/sign-up-dto';

import type { SafeUserInfo } from './api-responses';
import type { AuthResult } from './auth-error';

export interface AuthSession {
  readonly email: string;
  readonly token: string;
}

export type LoginResult = AuthResult<AuthSession>;
export type RegisterResult = AuthResult<SafeUserInfo>;

export interface AuthRepository {
  login(credentials: SignInDto, signal?: AbortSignal): Promise<LoginResult>;
  register(credentials: SignUpDto, signal?: AbortSignal): Promise<RegisterResult>;
}
