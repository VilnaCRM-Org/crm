import type { ObservabilityService } from '@/services/types/observability/observability';
import type { AuthStateVar } from '@auth/stores/auth-var';
import type { AuthRepository } from '@auth/types/auth-repository';
import type AuthRequestErrors from '@auth/utils/auth-request-errors';

export interface AuthStoreActionsDeps {
  readonly repository: AuthRepository;
  readonly authRequestErrors: AuthRequestErrors;
  readonly observability: ObservabilityService;
  readonly authState: AuthStateVar;
}
