export type RecoveryStep = 'request' | 'confirm';

export type RecoveryFailureReason =
  'invalid_email' | 'invalid_link' | 'policy_rejected' | 'rate_limited' | 'server' | 'network';

export interface RecoveryFailure {
  readonly reason: RecoveryFailureReason;
  readonly retryable: boolean;
}

export interface RecoverySentOutcome {
  readonly kind: 'sent';
  readonly maskedEmail: string;
}

export interface RecoveryConfirmedOutcome {
  readonly kind: 'confirmed';
}

export interface RecoveryFailedOutcome {
  readonly kind: 'failed';
  readonly failure: RecoveryFailure;
}

export type ResetPasswordOutcome = RecoverySentOutcome | RecoveryFailedOutcome;

export type CreateNewPasswordOutcome = RecoveryConfirmedOutcome | RecoveryFailedOutcome;
