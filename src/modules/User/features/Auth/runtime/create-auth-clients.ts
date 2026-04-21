import API_ENDPOINTS from '@/config/apiConfig';
import FetchHttpsClient from '@/services/HttpsClient/fetch-https-client';
import type HttpsClient from '@/services/HttpsClient/HttpsClient';

import BaseAPI from '@/modules/User/features/Auth/api/base-api';
import type { RequestOptions } from '@/modules/User/features/Auth/api/types';
import type {
  LoginResponse,
  RegistrationResponse,
} from '@/modules/User/features/Auth/types/ApiResponses';
import type {
  LoginUserDto,
  RegisterUserDto,
} from '@/modules/User/features/Auth/types/Credentials';

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

const isAbortError = (error: unknown): boolean =>
  error instanceof Error && error.name === 'AbortError';

async function runAuthCall<T>(fn: () => Promise<T>, toError: (e: unknown) => Error): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    if (isAbortError(error)) throw error;
    throw toError(error);
  }
}

function buildLoginAPI(
  httpsClient: HttpsClient,
  errorAdapter: ApiErrorAdapter
): AuthClients['loginAPI'] {
  return {
    login: (credentials, options) =>
      runAuthCall(
        () => httpsClient.post<LoginUserDto, LoginResponse>(API_ENDPOINTS.LOGIN, credentials, options),
        (e) => errorAdapter.toLoginError(e)
      ),
  };
}

function buildRegistrationAPI(
  httpsClient: HttpsClient,
  errorAdapter: ApiErrorAdapter
): AuthClients['registrationAPI'] {
  return {
    register: (credentials, options) =>
      runAuthCall(
        () =>
          httpsClient.post<RegisterUserDto, RegistrationResponse>(
            API_ENDPOINTS.REGISTER,
            credentials,
            options
          ),
        (e) => errorAdapter.toRegistrationError(e)
      ),
  };
}

export default function createAuthClients(): AuthClients {
  const httpsClient: HttpsClient = new FetchHttpsClient();
  const errorAdapter = new ApiErrorAdapter();
  return {
    loginAPI: buildLoginAPI(httpsClient, errorAdapter),
    registrationAPI: buildRegistrationAPI(httpsClient, errorAdapter),
  };
}
