export interface SocialLinkChangedUser {
  readonly success: boolean;
}

export interface SocialLinkChangedPayload {
  readonly user: SocialLinkChangedUser | null;
}
