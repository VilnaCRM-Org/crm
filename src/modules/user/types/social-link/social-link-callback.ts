export type SocialLinkProviderId = 'google' | 'facebook' | 'github' | 'twitter';

export interface SocialLinkAttempt {
  readonly provider: SocialLinkProviderId;
  readonly state: string;
}

export interface SocialLinkCallback {
  readonly provider: string | undefined;
  readonly state: string | null;
  readonly code: string | null;
  readonly error: string | null;
}

export type SocialLinkAnswerFault = 'refused' | 'missing' | 'malformed';

export interface SocialLinkCodeAnswer {
  readonly kind: 'code';
  readonly code: string;
}

export interface SocialLinkFaultAnswer {
  readonly kind: SocialLinkAnswerFault;
}

export type SocialLinkAnswer = SocialLinkCodeAnswer | SocialLinkFaultAnswer;

export type SocialLinkLocation = Pick<Location, 'replace'>;

export interface SocialLinkWindow {
  readonly location: SocialLinkLocation;
  readonly closed: boolean;
  close(): void;
}

export type SocialLinkAnswerSettler = (answer: SocialLinkAnswer | null) => void;
