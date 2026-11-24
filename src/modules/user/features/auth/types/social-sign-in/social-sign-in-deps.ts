import type { AuthState, AuthStateWriter } from '@auth/types/auth-store';
import type { EarlierSession } from '@auth/types/earlier-session';
import type AuthSecuritySignals from '@auth/utils/auth-security-signals';

export interface SocialSignInDeps {
  readonly authState: AuthStateWriter;
  readonly securitySignals: AuthSecuritySignals;
  readonly session: EarlierSession;
  readonly signedOut: AuthState;
}
