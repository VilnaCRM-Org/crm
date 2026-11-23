export type SocialLinkProviderId = 'google' | 'facebook' | 'github' | 'twitter';

export interface SocialLinkAttempt {
  readonly provider: SocialLinkProviderId;
  readonly state: string;
}

export interface SocialLinkAnswer {
  readonly code: string | null;
  readonly error: string | null;
}

export interface SocialLinkCallback extends SocialLinkAnswer {
  readonly provider: string | undefined;
  readonly state: string | null;
}

export type SocialLinkLocation = Pick<Location, 'replace'>;

export interface SocialLinkWindow {
  readonly location: SocialLinkLocation;
  close(): void;
}

export type SocialLinkAnswerSettler = (answer: SocialLinkAnswer | null) => void;
