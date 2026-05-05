import type { LoginResponse, RegistrationResponse } from '../features/Auth/types/api-responses';
import type { LoginUserDto, RegisterUserDto } from '../features/Auth/types/credentials';

type RequestOptions = {
  signal?: AbortSignal;
};

export interface LoginAPIContract {
  login(credentials: LoginUserDto, options?: RequestOptions): Promise<LoginResponse>;
}

export interface RegistrationAPIContract {
  register(credentials: RegisterUserDto, options?: RequestOptions): Promise<RegistrationResponse>;
}

export type ThunkExtra = {
  loginAPI: LoginAPIContract;
  registrationAPI: RegistrationAPIContract;
};
