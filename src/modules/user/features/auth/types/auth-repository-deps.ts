import type AuthUiErrorMapper from '@/modules/user/store/auth-ui-error-mapper';
import type LoginResponseMapper from '@/modules/user/store/login-response-mapper';
import type RegistrationResponseMapper from '@/modules/user/store/registration-response-mapper';
import type AbortErrorDetector from '@/utils/error/abort-error-detector';
import type { AuthErrorFactory, LoginAPI, RegistrationAPI } from '@auth/repositories';

export interface AuthRepositoryDeps {
  readonly loginAPI: LoginAPI;
  readonly registrationAPI: RegistrationAPI;
  readonly loginResponseMapper: LoginResponseMapper;
  readonly registrationResponseMapper: RegistrationResponseMapper;
  readonly authUiErrorMapper: AuthUiErrorMapper;
  readonly abortDetector: AbortErrorDetector;
  readonly authErrorFactory: AuthErrorFactory;
}
