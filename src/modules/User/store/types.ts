import type { RequestOptions } from '@/modules/User/features/Auth/api/types';
import type {
  LoginResponse,
  RegistrationResponse,
} from '@/modules/User/features/Auth/types/ApiResponses';
import type { LoginUserDto, RegisterUserDto } from '@/modules/User/features/Auth/types/Credentials';

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
