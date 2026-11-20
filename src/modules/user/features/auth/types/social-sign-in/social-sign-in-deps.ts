import type { AuthState, AuthStateWriter } from '@auth/types/auth-store';
import type AuthSecuritySignals from '@auth/utils/auth-security-signals';

export interface SocialEarlierSession {
  token(): string | null;
  signOut(): void;
}

export interface SocialSignInDeps {
  readonly authState: AuthStateWriter;
  readonly securitySignals: AuthSecuritySignals;
  readonly session: SocialEarlierSession;
  readonly signedOut: AuthState;
}
