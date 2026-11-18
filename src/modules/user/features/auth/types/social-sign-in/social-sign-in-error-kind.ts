export type SocialSignInErrorKind =
  | 'cancelled'
  | 'missing_parameters'
  | 'provider_mismatch'
  | 'unsupported_provider'
  | 'duplicate_email'
  | 'expired'
  | 'email_unavailable'
  | 'email_unverified'
  | 'unavailable'
  | 'two_factor_required'
  | 'generic';
