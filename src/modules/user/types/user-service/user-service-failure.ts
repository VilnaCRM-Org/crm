export type UserServiceFailureReason =
  'aborted' | 'network' | 'rate_limited' | 'server' | 'violation' | 'refused' | 'unknown';

export type FieldViolationReason = 'other';

export interface FieldViolation {
  readonly path: string;
  readonly reason: FieldViolationReason;
}

export interface FieldViolationSet {
  readonly items: readonly FieldViolation[];
}

export interface UserServiceFailure {
  readonly reason: UserServiceFailureReason;
  readonly status: number | null;
  readonly violations: FieldViolationSet;
}
