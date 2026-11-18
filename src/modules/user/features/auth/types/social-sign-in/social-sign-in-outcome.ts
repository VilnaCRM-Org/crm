import type { SocialSignInErrorKind } from './social-sign-in-error-kind';

export interface SocialCallbackParams {
  readonly code: string;
  readonly state: string;
}

export interface SocialSignedInOutcome {
  readonly kind: 'signed-in';
}

export interface SocialTwoFactorOutcome {
  readonly kind: 'two-factor';
  readonly pendingSessionId: string;
}

export interface SocialFailedOutcome {
  readonly kind: 'failed';
  readonly error: SocialSignInErrorKind;
}

export interface SocialAbortedOutcome {
  readonly kind: 'aborted';
}

export type SocialSignInOutcome =
  SocialSignedInOutcome | SocialTwoFactorOutcome | SocialFailedOutcome | SocialAbortedOutcome;
