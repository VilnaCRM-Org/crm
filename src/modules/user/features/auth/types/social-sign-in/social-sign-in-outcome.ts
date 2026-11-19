import type { SocialSignInErrorKind } from './social-sign-in-error-kind';

export interface SocialExpectedState {
  readonly provider: string;
  readonly state: string;
}

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

export interface SocialRedirectOutcome {
  readonly kind: 'redirect';
  readonly authorizationUrl: string;
  readonly state: string;
}

export type SocialFailureOutcome = SocialFailedOutcome | SocialAbortedOutcome;

export type SocialStartOutcome = SocialRedirectOutcome | SocialFailureOutcome;

export type SocialSignInOutcome =
  SocialSignedInOutcome | SocialTwoFactorOutcome | SocialFailedOutcome | SocialAbortedOutcome;
