import type { LoginUserDto, RegisterUserDto } from '../../types/credentials';

export interface LoginResult {
  token: string;
  email: string;
}

export interface CreateUserResult {
  id: string;
  email: string;
}

export interface IUserRepository {
  login(credentials: LoginUserDto, options?: { signal?: AbortSignal }): Promise<LoginResult>;
  createUser(credentials: RegisterUserDto): Promise<CreateUserResult>;
}
