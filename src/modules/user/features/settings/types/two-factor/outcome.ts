import type { TwoFactorSettingsEntity } from '@/modules/user/types/user/two-factor-settings-entity';

export type TwoFactorSettingsOperation = 'setup' | 'confirm' | 'disable' | 'regenerate';

export type TwoFactorSettingsFailureReason =
  | 'already_enabled'
  | 'not_enabled'
  | 'setup_not_initiated'
  | 'invalid_code'
  | 'reauth_required'
  | 'session_ended'
  | 'rate_limited'
  | 'network'
  | 'server';

export interface TwoFactorSettingsChangedOutcome {
  readonly kind: 'changed';
  readonly settings: TwoFactorSettingsEntity;
}

export interface TwoFactorSettingsFailedOutcome {
  readonly kind: 'failed';
  readonly reason: TwoFactorSettingsFailureReason;
}

export type TwoFactorSettingsOutcome =
  TwoFactorSettingsChangedOutcome | TwoFactorSettingsFailedOutcome;
