import { renderHook, type RenderHookResult } from '@testing-library/react';

import type {
  RecoveryCodesRegenerate,
  TwoFactorDisable,
  TwoFactorSetup,
} from '@/modules/user/features/settings/types/hooks/two-factor-operations';
import type {
  TwoFactorSettingsFailureReason,
  TwoFactorSettingsOutcome,
} from '@/modules/user/features/settings/types/two-factor/outcome';
import type {
  TwoFactorFailureRow,
  TwoFactorOperationPlan,
  TwoFactorSettingsHookDeps,
  TwoFactorSettingsProps,
  TwoFactorSettingsTransition,
  TwoFactorSettingsView,
  TwoFactorSettingsViewState,
} from '@/modules/user/features/settings/types/two-factor/settings-view';
import TwoFactorCodeNormalizer from '@/modules/user/lib/two-factor-code-normalizer';
import type { TwoFactorSettingsEntity } from '@/modules/user/types/user/two-factor-settings-entity';

export type {
  RecoveryCodesRegenerate,
  TwoFactorDisable,
  TwoFactorSetup,
  TwoFactorSettingsFailureReason,
  TwoFactorFailureRow,
  TwoFactorOperationPlan,
  TwoFactorSettingsOutcome,
  TwoFactorSettingsProps,
  TwoFactorSettingsTransition,
};

export const EMPTY_SETTINGS: TwoFactorSettingsEntity = {
  status: 'disabled',
  otpauthUri: null,
  secret: null,
  recoveryCodes: null,
};

export const viewState = (
  view: TwoFactorSettingsView,
  overrides: Partial<TwoFactorSettingsViewState> = {}
): TwoFactorSettingsViewState => ({
  view,
  fieldError: null,
  banner: null,
  statusCode: null,
  ...overrides,
});

export interface FakeDeps {
  readonly deps: TwoFactorSettingsHookDeps;
  readonly provider: {
    readonly setup: jest.Mock;
    readonly confirm: jest.Mock;
    readonly disable: jest.Mock;
    readonly regenerate: jest.Mock;
  };
  readonly apply: jest.Mock;
  readonly recordStatus: jest.Mock;
}

export const fakeDeps = (current: TwoFactorSettingsTransition): FakeDeps => {
  const provider = {
    setup: jest.fn(),
    confirm: jest.fn(),
    disable: jest.fn(),
    regenerate: jest.fn(),
  };
  const apply = jest.fn();
  const recordStatus = jest.fn();
  const deps: TwoFactorSettingsHookDeps = {
    provider: provider as unknown as TwoFactorSettingsHookDeps['provider'],
    normalizer: new TwoFactorCodeNormalizer(),
    read: () => current,
    apply,
    recordStatus,
  };
  return { deps, provider, apply, recordStatus };
};

export interface Mounted<T> extends FakeDeps {
  readonly utils: RenderHookResult<T, unknown>;
}

export const mountWith = <T>(
  useHook: (deps: TwoFactorSettingsHookDeps) => T,
  current: TwoFactorSettingsTransition
): Mounted<T> => {
  const fake = fakeDeps(current);
  return { ...fake, utils: renderHook(() => useHook(fake.deps)) };
};

export const failedOutcome = (reason: string): TwoFactorSettingsOutcome =>
  ({ kind: 'failed', reason }) as TwoFactorSettingsOutcome;
