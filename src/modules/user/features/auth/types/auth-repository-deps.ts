import type AuthUiErrorMapper from '@/modules/user/store/auth-ui-error-mapper';
import type RegistrationResponseMapper from '@/modules/user/store/registration-response-mapper';
import type AbortErrorDetector from '@/utils/error/abort-error-detector';
import type { AuthErrorFactory, RegistrationAPI } from '@auth/repositories';

export interface AuthRepositoryDeps {
  readonly registrationAPI: RegistrationAPI;
  readonly registrationResponseMapper: RegistrationResponseMapper;
  readonly authUiErrorMapper: AuthUiErrorMapper;
  readonly abortDetector: AbortErrorDetector;
  readonly authErrorFactory: AuthErrorFactory;
}
