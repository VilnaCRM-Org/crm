import type TwoFactorCodeNormalizer from '@/modules/user/lib/two-factor-code-normalizer';
import type {
  TwoFactorBannerCode,
  TwoFactorFieldError,
} from '@/modules/user/types/two-factor/code';
import type { TwoFactorDto } from '@/modules/user/types/user/two-factor-dto';
import type { TwoFactorSettingsEntity } from '@/modules/user/types/user/two-factor-settings-entity';
import type { TwoFactorStatus } from '@/routes/types/protected-outlet-context';

import type { TwoFactorSettingsProvider } from '../../data-providers';

import type { TwoFactorSettingsFailureReason, TwoFactorSettingsOutcome } from './outcome';

export type TwoFactorSettingsView =
  'off' | 'setup' | 'codes' | 'on' | 'disable' | 'regenerate' | 'reauth';

export type TwoFactorStatusCode = 'already_on' | 'stale' | 'disabled' | 'already_off';

export interface TwoFactorSettingsViewState {
  readonly view: TwoFactorSettingsView;
  readonly fieldError: TwoFactorFieldError | null;
  readonly banner: TwoFactorBannerCode | null;
  readonly statusCode: TwoFactorStatusCode | null;
}

export interface TwoFactorSettingsTransition {
  readonly settings: TwoFactorSettingsEntity;
  readonly view: TwoFactorSettingsViewState;
}

export interface TwoFactorSettingsCallbacks {
  readonly start: () => void;
  readonly confirm: (dto: TwoFactorDto) => void;
  readonly done: () => void;
  readonly openDisable: () => void;
  readonly disable: (dto: TwoFactorDto) => void;
  readonly openRegenerate: () => void;
  readonly regenerate: () => void;
  readonly cancel: () => void;
  readonly retry: () => void;
}

export interface TwoFactorSettingsProps {
  readonly settings: TwoFactorSettingsEntity;
  readonly view: TwoFactorSettingsViewState;
  readonly callbacks: TwoFactorSettingsCallbacks;
  readonly isSubmitting: boolean;
}

export interface TwoFactorSettingsHookDeps {
  readonly provider: TwoFactorSettingsProvider;
  readonly normalizer: TwoFactorCodeNormalizer;
  readonly read: () => TwoFactorSettingsTransition;
  readonly apply: (transition: TwoFactorSettingsTransition) => void;
  readonly recordStatus: (status: TwoFactorStatus) => void;
}

export interface TwoFactorFailureRow {
  readonly view: TwoFactorSettingsView | null;
  readonly fieldError: TwoFactorFieldError | null;
  readonly statusCode: TwoFactorStatusCode | null;
  readonly record: TwoFactorStatus | null;
}

export interface TwoFactorOperationPlan {
  readonly view: TwoFactorSettingsView;
  readonly statusCode: TwoFactorStatusCode | null;
  readonly record: TwoFactorStatus | null;
  readonly failures: ReadonlyMap<TwoFactorSettingsFailureReason, TwoFactorFailureRow>;
}

export interface TwoFactorSettle {
  readonly settle: (outcome: TwoFactorSettingsOutcome, plan: TwoFactorOperationPlan) => void;
  readonly show: (view: TwoFactorSettingsView) => void;
  readonly refuse: (fieldError: TwoFactorFieldError) => void;
}
