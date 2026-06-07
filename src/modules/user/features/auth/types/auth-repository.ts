import type { SafeUserInfo } from './api-responses';
import type { AuthResult } from './auth-error';
import type { LoginUserDto, RegisterUserDto } from './credentials';

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
