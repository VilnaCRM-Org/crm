import type { RequestOptions } from '@/modules/user/features/auth/repositories';
import type {
  LoginResponse,
  RegistrationResponse,
} from '@/modules/user/features/auth/types/api-responses';
import type { LoginUserDto, RegisterUserDto } from '@/modules/user/features/auth/types/credentials';

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
