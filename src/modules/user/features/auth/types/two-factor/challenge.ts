import type { TwoFactorDto } from '@/modules/user/types/user/two-factor-dto';

export interface TwoFactorChallengeInput extends TwoFactorDto {
  readonly pendingSessionId: string;
}

export type ChallengeFailureReason =
  'invalid_code' | 'expired_session' | 'locked' | 'rate_limited' | 'network' | 'server';

export interface ChallengeCompletedOutcome {
  readonly kind: 'completed';
  readonly token: string;
  readonly recoveryCodesRemaining: number | null;
}

export interface ChallengeFailedOutcome {
  readonly kind: 'failed';
  readonly reason: ChallengeFailureReason;
}

export type ChallengeResult = ChallengeCompletedOutcome | ChallengeFailedOutcome;
