import type { RequestOptions } from '../features/Auth/api/types';
import type { LoginResponse, RegistrationResponse } from '../features/Auth/types/ApiResponses';
import type { LoginUserDto, RegisterUserDto } from '../features/Auth/types/Credentials';

type LoginApiClient = {
  login(credentials: LoginUserDto, options?: RequestOptions): Promise<LoginResponse>;
};

type RegistrationApiClient = {
  register(credentials: RegisterUserDto, options?: RequestOptions): Promise<RegistrationResponse>;
};

export type ThunkExtra = {
  loginAPI: LoginApiClient;
  registrationAPI: RegistrationApiClient;
};
