import type { RequestOptions } from '@auth/api/types';
import type { LoginResponse, RegistrationResponse } from '@auth/types/ApiResponses';
import type { LoginUserDto, RegisterUserDto } from '@auth/types/Credentials';

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
