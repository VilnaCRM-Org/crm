import type { AbortableRun } from '@/hooks/types/use-abortable-submit';
import type TwoFactorCodeNormalizer from '@/modules/user/lib/two-factor-code-normalizer';
import type {
  TwoFactorCodeAcceptance,
  TwoFactorFieldError,
} from '@/modules/user/types/two-factor/code';
import type { TwoFactorDto } from '@/modules/user/types/user/two-factor-dto';

import type { TwoFactorSettingsOutcome } from '../two-factor/outcome';
import type {
  TwoFactorOperationPlan,
  TwoFactorSettingsTransition,
  TwoFactorSettingsView,
  TwoFactorSettle,
} from '../two-factor/settings-view';

import type {
  RecoveryCodesRegenerate,
  TwoFactorDisable,
  TwoFactorSetup,
} from './two-factor-operations';

export interface SettledSubmitOptions<TInput> {
  readonly run: AbortableRun<TInput, TwoFactorSettingsOutcome>;
  readonly plan: TwoFactorOperationPlan;
  readonly settle: TwoFactorSettle['settle'];
}

export interface SettledSubmit<TInput> {
  readonly isSubmitting: boolean;
  readonly send: (input: TInput) => Promise<void>;
}

export interface CodeEntry {
  readonly normalizer: TwoFactorCodeNormalizer;
  readonly accept: TwoFactorCodeAcceptance;
  readonly refusal: TwoFactorFieldError;
  readonly refuse: TwoFactorSettle['refuse'];
}

export interface TransitionStore {
  readonly current: TwoFactorSettingsTransition;
  readonly read: () => TwoFactorSettingsTransition;
  readonly apply: (transition: TwoFactorSettingsTransition) => void;
}

export interface TwoFactorOperations {
  readonly setup: TwoFactorSetup;
  readonly disable: TwoFactorDisable;
  readonly regenerate: RecoveryCodesRegenerate;
}

export type CodeSubmit = SettledSubmit<TwoFactorDto>;

export interface ViewTrack {
  readonly view: TwoFactorSettingsView;
  readonly from: TwoFactorSettingsView | null;
}
