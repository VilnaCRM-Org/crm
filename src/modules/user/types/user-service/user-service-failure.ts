export type UserServiceFailureReason =
  | 'aborted'
  | 'network'
  | 'rate_limited'
  | 'server'
  | 'violation'
  | 'refused'
  | 'unknown'
  | 'unauthenticated'
  | 'access_denied'
  | 'invalid_password'
  | 'locked'
  | 'invalid_code'
  | 'expired_session'
  | 'setup_not_initiated'
  | 'already_enabled'
  | 'not_enabled'
  | 'reauth_required';

export type FieldViolationReason = 'other' | 'taken';

export interface FieldViolation {
  readonly path: string;
  readonly reason: FieldViolationReason;
}

export interface FieldViolationSet {
  readonly items: readonly FieldViolation[];
  readonly complete: boolean;
}

export interface UserServiceFailure {
  readonly reason: UserServiceFailureReason;
  readonly status: number | null;
  readonly violations: FieldViolationSet;
}
