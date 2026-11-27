import type { StoreApi } from 'zustand';

import type { AuthState } from '@auth/types/auth-store';
import type { EarlierSession } from '@auth/types/earlier-session';
import type AuthSecuritySignals from '@auth/utils/auth-security-signals';

export interface SocialSignInDeps {
  readonly authState: StoreApi<AuthState>;
  readonly securitySignals: AuthSecuritySignals;
  readonly session: EarlierSession;
  readonly signedOut: AuthState;
}
