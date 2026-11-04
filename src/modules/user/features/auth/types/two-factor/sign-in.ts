import type { AuthResult } from '@auth/types/auth-error';

export interface SignInSessionOutcome {
  readonly kind: 'session';
  readonly email: string;
  readonly token: string;
}

export interface SignInChallengeOutcome {
  readonly kind: 'challenge';
  readonly email: string;
  readonly pendingSessionId: string;
}

export type SignInOutcome = SignInSessionOutcome | SignInChallengeOutcome;

export type SignInResult = AuthResult<SignInOutcome>;
