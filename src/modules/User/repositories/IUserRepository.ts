import type { LoginUserDto, RegisterUserDto } from '@/modules/User/features/Auth/types/Credentials';

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
