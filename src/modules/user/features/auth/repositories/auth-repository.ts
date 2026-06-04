import type { SafeUserInfo } from '../types/api-responses';
import type { AuthError, AuthResult } from '../types/auth-error';
import type { LoginUserDto, RegisterUserDto } from '../types/credentials';

export interface AuthSession {
  readonly email: string;
  readonly token: string;
}

export type LoginResult = AuthResult<AuthSession>;
export type RegisterResult = AuthResult<SafeUserInfo>;

export interface AuthRepository {
  login(credentials: LoginUserDto, signal?: AbortSignal): Promise<LoginResult>;
  register(credentials: RegisterUserDto, signal?: AbortSignal): Promise<RegisterResult>;
}

export type { AuthError };
