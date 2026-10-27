import type { TwoFactorChallengeState } from '@auth/types/two-factor/challenge-view';

export interface ChallengeCodeFieldProps {
  readonly state: TwoFactorChallengeState;
}
