import type { StoreApi } from 'zustand';

import type { AuthRepository } from '@auth/types/auth-repository';
import type { AuthState } from '@auth/types/auth-store';
import type AuthRequestErrors from '@auth/utils/auth-request-errors';
import type AuthSecuritySignals from '@auth/utils/auth-security-signals';

export interface AuthStoreActionsDeps {
  readonly repository: AuthRepository;
  readonly authRequestErrors: AuthRequestErrors;
  readonly authState: StoreApi<AuthState>;
  readonly securitySignals: AuthSecuritySignals;
}
