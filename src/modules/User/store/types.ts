import type { RequestOptions } from '@/modules/User/features/Auth/api/types';
import type { LoginResponse, RegistrationResponse } from '@/modules/User/features/Auth/types/ApiResponses';
import type { LoginUserDto, RegisterUserDto } from '@/modules/User/features/Auth/types/Credentials';

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
