import type { SocialLinkProviderId } from '@/modules/user/types/social-link/social-link-callback';

export type SocialLinkFailureKind =
  | 'cancelled'
  | 'blocked'
  | 'already_linked'
  | 'provider_linked'
  | 'last_method'
  | 'expired'
  | 'unavailable'
  | 'generic';

export interface LinkedProviderSet {
  readonly items: readonly SocialLinkProviderId[];
}

export interface SocialLinksListedOutcome {
  readonly kind: 'listed';
  readonly linked: LinkedProviderSet;
}

export type SocialLinksReadFailureReason = 'session_ended' | 'unavailable';

export interface SocialLinksReadFailedOutcome {
  readonly kind: 'failed';
  readonly reason: SocialLinksReadFailureReason;
}

export type SocialLinksReadOutcome = SocialLinksListedOutcome | SocialLinksReadFailedOutcome;

export interface SocialLinkCode {
  readonly code: string;
  readonly state: string;
}

export interface SocialLinkStartedOutcome {
  readonly kind: 'started';
  readonly authorizationUrl: string;
  readonly state: string;
}

export interface SocialLinkChangedOutcome {
  readonly kind: 'changed';
}

export interface SocialLinkFailedOutcome {
  readonly kind: 'failed';
  readonly reason: SocialLinkFailureKind;
}

export interface SocialLinkAbortedOutcome {
  readonly kind: 'aborted';
}

export type SocialLinkFailureOutcome = SocialLinkFailedOutcome | SocialLinkAbortedOutcome;

export type SocialLinkStartOutcome = SocialLinkStartedOutcome | SocialLinkFailureOutcome;

export type SocialLinkChangeOutcome = SocialLinkChangedOutcome | SocialLinkFailureOutcome;
