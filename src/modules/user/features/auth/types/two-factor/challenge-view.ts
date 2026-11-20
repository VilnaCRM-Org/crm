import type { Dispatch } from 'react';
import type { NavigateFunction } from 'react-router';

import type { AbortableSubmit } from '@/hooks/types/use-abortable-submit';
import type TwoFactorCodeNormalizer from '@/modules/user/lib/two-factor-code-normalizer';
import type {
  TwoFactorBannerCode,
  TwoFactorCodeKind,
  TwoFactorFieldError,
} from '@/modules/user/types/two-factor/code';
import type { TwoFactorDto } from '@/modules/user/types/user/two-factor-dto';
import type { RedirectLocationLike } from '@/routes/types/navigation-state';
import type { AuthProviderLoader } from '@auth/stores';
import type { ChallengeResult } from '@auth/types/two-factor/challenge';

export interface ChallengeView {
  readonly mode: TwoFactorCodeKind;
  readonly value: string;
  readonly fieldError: TwoFactorFieldError | null;
  readonly banner: TwoFactorBannerCode | null;
  readonly bannerOccurrence: number;
  readonly focusRequest: number;
}

export interface ChallengeViewStore {
  readonly view: ChallengeView;
  readonly dispatch: Dispatch<ChallengeAction>;
}

export interface TwoFactorChallengeState extends ChallengeView {
  readonly isSubmitting: boolean;
}

export interface TwoFactorChallengeCallbacks {
  readonly submit: (dto: TwoFactorDto) => void;
  readonly switchMode: () => void;
}

export interface TwoFactorChallengeProps {
  readonly state: TwoFactorChallengeState;
  readonly callbacks: TwoFactorChallengeCallbacks;
}

export interface ChallengeSubmitHookDeps {
  readonly loader: AuthProviderLoader;
  readonly navigate: NavigateFunction;
  readonly from: RedirectLocationLike | undefined;
}

export interface ChallengeSubmittedAction {
  readonly type: 'submitted';
  readonly value: string;
}

export interface ChallengeRejectedAction {
  readonly type: 'rejected';
  readonly value: string;
  readonly fieldError: TwoFactorFieldError;
}

export interface ChallengeSettledAction {
  readonly type: 'settled';
  readonly result: ChallengeResult | null;
}

export interface ChallengeSwitchedAction {
  readonly type: 'switched';
}

export type ChallengeAction =
  | ChallengeSubmittedAction
  | ChallengeRejectedAction
  | ChallengeSettledAction
  | ChallengeSwitchedAction;

export type ChallengeSubmitter = AbortableSubmit<TwoFactorDto, ChallengeResult>;

export interface ChallengeSender {
  readonly send: (dto: TwoFactorDto, value: string) => Promise<void>;
}

export interface ChallengeCallbackDeps {
  readonly normalizer: TwoFactorCodeNormalizer;
  readonly view: ChallengeView;
  readonly dispatch: Dispatch<ChallengeAction>;
  readonly sender: ChallengeSender;
}
