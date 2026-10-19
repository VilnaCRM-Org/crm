import type { UserEntity } from '@/modules/user/types/user/user-entity';

export type ProfileField = 'fullName' | 'email' | 'currentPassword' | 'newPassword';

export type FieldErrorReason =
  | 'name_rejected'
  | 'email_taken'
  | 'email_invalid'
  | 'password_wrong'
  | 'password_not_accepted'
  | 'new_password_rejected';

export interface ProfileFieldError {
  readonly field: ProfileField;
  readonly reason: FieldErrorReason;
}

export interface ProfileFieldErrorSet {
  readonly items: readonly ProfileFieldError[];
}

export type ProfileFailureReason = 'session_ended' | 'rate_limited' | 'transient' | 'rejected';

export interface ProfileUserOutcome {
  readonly kind: 'ok';
  readonly user: UserEntity;
}

export interface ProfileInvalidOutcome {
  readonly kind: 'invalid';
  readonly errors: ProfileFieldErrorSet;
}

export interface ProfileSentOutcome {
  readonly kind: 'sent';
  readonly confirmed: boolean;
}

export interface ProfileFailedOutcome {
  readonly kind: 'failed';
  readonly reason: ProfileFailureReason;
}

export type ProfileReadOutcome = ProfileUserOutcome | ProfileFailedOutcome;

export type ProfileUpdateOutcome =
  ProfileUserOutcome | ProfileInvalidOutcome | ProfileFailedOutcome;

export type ProfileResendOutcome = ProfileSentOutcome | ProfileFailedOutcome;
