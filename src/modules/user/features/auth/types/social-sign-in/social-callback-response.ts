export interface SocialDirectSignInResponse {
  readonly '2fa_enabled': false;
  readonly access_token: string;
}

export interface SocialPendingTwoFactorResponse {
  readonly '2fa_enabled': true;
  readonly pending_session_id: string;
}

export type SocialCallbackResponse = SocialDirectSignInResponse | SocialPendingTwoFactorResponse;

export interface SocialAuthProblem {
  readonly status: number;
  readonly error_code: string;
}
