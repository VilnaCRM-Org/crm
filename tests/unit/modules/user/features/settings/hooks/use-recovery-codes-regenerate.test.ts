import { act } from '@testing-library/react';
import * as React from 'react';

import useRegenerate from '@/modules/user/features/settings/hooks/use-recovery-codes-regenerate';
import { buildRecoveryCodeSet } from '@tests/builders';
import loadIsolated from '@tests/unit/utils/isolated-module';

import {
  EMPTY_SETTINGS,
  failedOutcome as failed,
  mountWith,
  viewState,
  type Mounted,
  type RecoveryCodesRegenerate,
  type TwoFactorSettingsFailureReason,
  type TwoFactorSettingsTransition,
} from './two-factor-test-deps';

const ENABLED = { ...EMPTY_SETTINGS, status: 'enabled' as const };
const confirmView: TwoFactorSettingsTransition = {
  settings: ENABLED,
  view: viewState('regenerate'),
};

const mount = (
  current: TwoFactorSettingsTransition = confirmView
): Mounted<RecoveryCodesRegenerate> => mountWith(useRegenerate, current);

describe('useRecoveryCodesRegenerate', () => {
  it('opens the confirmation with fresh view state', () => {
    const { utils, apply } = mount({
      settings: ENABLED,
      view: viewState('on', { statusCode: 'disabled' }),
    });

    act(() => utils.result.current.open());

    expect(apply).toHaveBeenCalledWith({ settings: ENABLED, view: viewState('regenerate') });
  });

  it('sends regenerate once with a live signal and shows the codes view', async () => {
    const { utils, provider, apply, recordStatus } = mount();
    const settings = { ...ENABLED, recoveryCodes: buildRecoveryCodeSet() };
    provider.regenerate.mockResolvedValue({ kind: 'changed', settings });

    await act(async () => utils.result.current.regenerate());

    expect(provider.regenerate).toHaveBeenCalledTimes(1);
    expect((provider.regenerate.mock.calls[0]?.[0] as AbortSignal).aborted).toBe(false);
    expect(apply).toHaveBeenCalledWith({ settings, view: viewState('codes') });
    expect(recordStatus).not.toHaveBeenCalled();
  });

  it('moves to the reauth view when a fresh sign-in is required', async () => {
    const { utils, provider, apply, recordStatus } = mount();
    provider.regenerate.mockResolvedValue(failed('reauth_required'));

    await act(async () => utils.result.current.regenerate());

    expect(apply).toHaveBeenCalledWith({ settings: ENABLED, view: viewState('reauth') });
    expect(recordStatus).not.toHaveBeenCalled();
  });

  it('moves to off with already_off and records disabled when 2FA is not enabled', async () => {
    const { utils, provider, apply, recordStatus } = mount();
    provider.regenerate.mockResolvedValue(failed('not_enabled'));

    await act(async () => utils.result.current.regenerate());

    expect(apply).toHaveBeenCalledWith({
      settings: ENABLED,
      view: viewState('off', { statusCode: 'already_off' }),
    });
    expect(recordStatus).toHaveBeenCalledWith('disabled');
  });

  it.each([
    ['rate_limited', 'rate_limited'],
    ['network', 'transient'],
    ['server', 'transient'],
  ] as const)('keeps the confirmation with the %s banner', async (reason, banner) => {
    const { utils, provider, apply } = mount();
    provider.regenerate.mockResolvedValue(failed(reason));

    await act(async () => utils.result.current.regenerate());

    expect(apply).toHaveBeenCalledWith({
      settings: ENABLED,
      view: viewState('regenerate', { banner, bannerOccurrence: 1 }),
    });
  });

  it('publishes nothing for session_ended', async () => {
    const { utils, provider, apply, recordStatus } = mount();
    provider.regenerate.mockResolvedValue(failed('session_ended'));

    await act(async () => utils.result.current.regenerate());

    expect(apply).not.toHaveBeenCalled();
    expect(recordStatus).not.toHaveBeenCalled();
  });

  it('sends one request for two quick activations and reports busy', async () => {
    const { utils, provider } = mount();
    provider.regenerate.mockReturnValue(new Promise(() => undefined));

    await act(async () => {
      utils.result.current.regenerate();
      utils.result.current.regenerate();
    });

    expect(provider.regenerate).toHaveBeenCalledTimes(1);
    expect(utils.result.current.isSubmitting).toBe(true);
  });

  it('offers no separate retry, since the form submit sends regenerate again', () => {
    const { utils } = mount({ settings: ENABLED, view: viewState('regenerate') });

    expect(Object.keys(utils.result.current).sort()).toEqual([
      'isSubmitting',
      'open',
      'regenerate',
    ]);
  });
});

describe('useRecoveryCodesRegenerate plan loaded inside the test', () => {
  const REASONS: readonly TwoFactorSettingsFailureReason[] = [
    'already_enabled',
    'not_enabled',
    'setup_not_initiated',
    'invalid_code',
    'reauth_required',
    'session_ended',
    'rate_limited',
    'network',
    'server',
  ];

  const bannerOf = (
    reason: TwoFactorSettingsFailureReason
  ): 'rate_limited' | 'transient' | null => {
    if (reason === 'session_ended') return null;
    return reason === 'rate_limited' ? 'rate_limited' : 'transient';
  };

  const mountLoaded = async (): Promise<Mounted<RecoveryCodesRegenerate>> => {
    const hook = await loadIsolated(async () => {
      jest.doMock('react', () => React);
      return (await import('@/modules/user/features/settings/hooks/use-recovery-codes-regenerate'))
        .default;
    });
    return mountWith(hook, confirmView);
  };

  it('shows the codes view with the entity and records nothing on success', async () => {
    const { utils, provider, apply, recordStatus } = await mountLoaded();
    const settings = { ...ENABLED, recoveryCodes: buildRecoveryCodeSet() };
    provider.regenerate.mockResolvedValue({ kind: 'changed', settings });

    await act(async () => utils.result.current.regenerate());

    expect(apply.mock.calls).toStrictEqual([[{ settings, view: viewState('codes') }]]);
    expect(recordStatus).not.toHaveBeenCalled();
  });

  it.each(REASONS)('settles the regenerate failure %s', async (reason) => {
    const { utils, provider, apply, recordStatus } = await mountLoaded();
    provider.regenerate.mockResolvedValue(failed(reason));
    const banner = bannerOf(reason);

    await act(async () => utils.result.current.regenerate());

    const rows: Partial<Record<TwoFactorSettingsFailureReason, ReturnType<typeof viewState>>> = {
      reauth_required: viewState('reauth'),
      not_enabled: viewState('off', { statusCode: 'already_off' }),
    };
    const next = rows[reason] ?? viewState('regenerate', { banner, bannerOccurrence: 1 });
    expect(apply.mock.calls).toStrictEqual(
      banner === null && rows[reason] === undefined ? [] : [[{ settings: ENABLED, view: next }]]
    );
    expect(recordStatus.mock.calls).toStrictEqual(reason === 'not_enabled' ? [['disabled']] : []);
  });
});
