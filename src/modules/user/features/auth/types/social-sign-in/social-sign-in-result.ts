export interface SocialInitiation {
  readonly authorizationUrl: string;
  readonly state: string;
}

export interface SocialDirectCompletion {
  readonly twoFactorEnabled?: false | null | undefined;
  readonly accessToken: string;
}

export interface SocialPendingCompletion {
  readonly twoFactorEnabled: true;
  readonly pendingSessionId: string;
}

export type SocialCompletion = SocialDirectCompletion | SocialPendingCompletion;
