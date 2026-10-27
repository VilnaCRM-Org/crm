import { act } from '@testing-library/react';

import useRegenerate from '@/modules/user/features/settings/hooks/use-recovery-codes-regenerate';
import { buildRecoveryCodeSet } from '@tests/builders';

import {
  EMPTY_SETTINGS,
  failedOutcome as failed,
  mountWith,
  viewState,
  type Mounted,
  type RecoveryCodesRegenerate,
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
      view: viewState('regenerate', { banner }),
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

  it('sends exactly one more regenerate on retry from the confirmation', async () => {
    const { utils, provider } = mount({
      settings: ENABLED,
      view: viewState('regenerate', { banner: 'transient' }),
    });
    provider.regenerate.mockResolvedValue(failed('network'));

    await act(async () => utils.result.current.retry());

    expect(provider.regenerate).toHaveBeenCalledTimes(1);
  });

  it.each(['off', 'setup', 'codes', 'on', 'disable', 'reauth'] as const)(
    'does nothing on retry from the %s view',
    async (view) => {
      const { utils, provider } = mount({ settings: ENABLED, view: viewState(view) });

      await act(async () => utils.result.current.retry());

      expect(provider.regenerate).not.toHaveBeenCalled();
    }
  );
});
