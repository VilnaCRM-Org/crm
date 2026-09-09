import type { AuthStateVar } from '@auth/stores/auth-var';
import type { AuthRepository } from '@auth/types/auth-repository';
import type AuthRequestErrors from '@auth/utils/auth-request-errors';
import type AuthSecuritySignals from '@auth/utils/auth-security-signals';

export interface AuthStoreActionsDeps {
  readonly repository: AuthRepository;
  readonly authRequestErrors: AuthRequestErrors;
  readonly authState: AuthStateVar;
  readonly securitySignals: AuthSecuritySignals;
}
