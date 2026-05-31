import type { RequestOptions } from '@auth/repositories';
import type { LoginResponse, RegistrationResponse } from '@auth/types/api-responses';
import type { LoginUserDto, RegisterUserDto } from '@auth/types/credentials';

interface LoginApiClient {
  login(credentials: LoginUserDto, options?: RequestOptions): Promise<LoginResponse | undefined>;
}

interface RegistrationApiClient {
  register(
    credentials: RegisterUserDto,
    options?: RequestOptions
  ): Promise<RegistrationResponse | undefined>;
}

export interface ThunkExtra {
  loginAPI: LoginApiClient;
  registrationAPI: RegistrationApiClient;
}
