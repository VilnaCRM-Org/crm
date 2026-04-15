import API_ENDPOINTS from '@/config/apiConfig';
import BaseAPI from '@/modules/User/features/Auth/api/BaseAPI';
import type { RequestOptions } from '@/modules/User/features/Auth/api/types';
import type {
  LoginResponse,
  RegistrationResponse,
} from '@/modules/User/features/Auth/types/ApiResponses';
import type {
  LoginUserDto,
  RegisterUserDto,
} from '@/modules/User/features/Auth/types/Credentials';
import FetchHttpsClient from '@/services/HttpsClient/FetchHttpsClient';
import type HttpsClient from '@/services/HttpsClient/HttpsClient';

type AuthClients = {
  loginAPI: {
    login(credentials: LoginUserDto, options?: RequestOptions): Promise<LoginResponse>;
  };
  registrationAPI: {
    register(
      credentials: RegisterUserDto,
      options?: RequestOptions
    ): Promise<RegistrationResponse>;
  };
};

class ApiErrorAdapter extends BaseAPI {
  public toLoginError(error: unknown): Error {
    return this.handleApiError(error, 'Login');
  }

  public toRegistrationError(error: unknown): Error {
    return this.handleApiError(error, 'Registration');
  }
}

export default function createAuthClients(): AuthClients {
  const httpsClient: HttpsClient = new FetchHttpsClient();
  const errorAdapter = new ApiErrorAdapter();

  return {
    loginAPI: {
      async login(credentials: LoginUserDto, options?: RequestOptions): Promise<LoginResponse> {
        try {
          return await httpsClient.post<LoginUserDto, LoginResponse>(
            API_ENDPOINTS.LOGIN,
            credentials,
            options
          );
        } catch (error) {
          if (error instanceof Error && error.name === 'AbortError') {
            throw error;
          }

          throw errorAdapter.toLoginError(error);
        }
      },
    },
    registrationAPI: {
      async register(
        credentials: RegisterUserDto,
        options?: RequestOptions
      ): Promise<RegistrationResponse> {
        try {
          return await httpsClient.post<RegisterUserDto, RegistrationResponse>(
            API_ENDPOINTS.REGISTER,
            credentials,
            options
          );
        } catch (error) {
          if (error instanceof Error && error.name === 'AbortError') {
            throw error;
          }

          throw errorAdapter.toRegistrationError(error);
        }
      },
    },
  };
}
