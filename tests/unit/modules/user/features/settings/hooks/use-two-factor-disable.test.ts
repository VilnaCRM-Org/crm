import { act } from '@testing-library/react';

import useTwoFactorDisable from '@/modules/user/features/settings/hooks/use-two-factor-disable';
import { buildRecoveryCode, buildTotpCode } from '@tests/builders';

import {
  EMPTY_SETTINGS,
  failedOutcome as failed,
  mountWith,
  viewState,
  type Mounted,
  type TwoFactorDisable,
  type TwoFactorSettingsTransition,
} from './two-factor-test-deps';

const ENABLED = { ...EMPTY_SETTINGS, status: 'enabled' as const };
const disableView: TwoFactorSettingsTransition = {
  settings: ENABLED,
  view: viewState('disable'),
};

const mount = (current: TwoFactorSettingsTransition = disableView): Mounted<TwoFactorDisable> =>
  mountWith(useTwoFactorDisable, current);

describe('useTwoFactorDisable', () => {
  it('opens the confirmation with fresh view state', () => {
    const { utils, apply } = mount({
      settings: ENABLED,
      view: viewState('on', { statusCode: 'disabled' }),
    });

    act(() => utils.result.current.open());

    expect(apply).toHaveBeenCalledWith({ settings: ENABLED, view: viewState('disable') });
  });

  it.each(['disable', 'regenerate'] as const)('cancels the %s confirmation back to on', (view) => {
    const { utils, apply } = mount({
      settings: ENABLED,
      view: viewState(view, { fieldError: 'format' }),
    });

    act(() => utils.result.current.cancel());

    expect(apply).toHaveBeenCalledWith({ settings: ENABLED, view: viewState('on') });
  });

  describe('disable', () => {
    it.each(['', '12345', '1234567', 'abc', 'abcd-234', 'abcd-23456', 'ab cd-ef!'])(
      'refuses "%s" as a format error and sends nothing',
      async (code) => {
        const { utils, provider, apply } = mount();

        await act(async () => utils.result.current.disable({ twoFactorCode: code }));

        expect(provider.disable).not.toHaveBeenCalled();
        expect(apply).toHaveBeenCalledWith({
          settings: ENABLED,
          view: viewState('disable', { fieldError: 'format' }),
        });
      }
    );

    it('sends six digits once and moves to off, recording disabled', async () => {
      const { utils, provider, apply, recordStatus } = mount();
      const code = buildTotpCode();
      provider.disable.mockResolvedValue({ kind: 'changed', settings: EMPTY_SETTINGS });

      await act(async () => utils.result.current.disable({ twoFactorCode: code }));

      expect(provider.disable).toHaveBeenCalledTimes(1);
      expect(provider.disable.mock.calls[0]?.[0]).toEqual({ twoFactorCode: code });
      expect(apply).toHaveBeenCalledWith({
        settings: EMPTY_SETTINGS,
        view: viewState('off', { statusCode: 'disabled' }),
      });
      expect(recordStatus).toHaveBeenCalledWith('disabled');
    });

    it.each([
      ['abcd2345', 'ABCD-2345'],
      ['abcd-2345', 'ABCD-2345'],
      [' ab cd 23 45 ', 'ABCD-2345'],
    ])('normalises the recovery code "%s" to %s', async (typed, sent) => {
      const { utils, provider } = mount();
      provider.disable.mockResolvedValue(failed('network'));

      await act(async () => utils.result.current.disable({ twoFactorCode: typed }));

      expect(provider.disable.mock.calls[0]?.[0]).toEqual({ twoFactorCode: sent });
    });

    it('sends a generated recovery code as it is', async () => {
      const { utils, provider } = mount();
      const code = buildRecoveryCode();
      provider.disable.mockResolvedValue(failed('network'));

      await act(async () => utils.result.current.disable({ twoFactorCode: code }));

      expect(provider.disable.mock.calls[0]?.[0]).toEqual({ twoFactorCode: code });
    });

    it('moves to off with already_off and records disabled when 2FA is not enabled', async () => {
      const { utils, provider, apply, recordStatus } = mount();
      provider.disable.mockResolvedValue(failed('not_enabled'));

      await act(async () => utils.result.current.disable({ twoFactorCode: buildTotpCode() }));

      expect(apply).toHaveBeenCalledWith({
        settings: ENABLED,
        view: viewState('off', { statusCode: 'already_off' }),
      });
      expect(recordStatus).toHaveBeenCalledWith('disabled');
    });

    it('keeps the confirmation with the invalid_code field error', async () => {
      const { utils, provider, apply, recordStatus } = mount();
      provider.disable.mockResolvedValue(failed('invalid_code'));

      await act(async () => utils.result.current.disable({ twoFactorCode: buildTotpCode() }));

      expect(apply).toHaveBeenCalledWith({
        settings: ENABLED,
        view: viewState('disable', { fieldError: 'invalid_code' }),
      });
      expect(recordStatus).not.toHaveBeenCalled();
    });

    it.each([
      ['rate_limited', 'rate_limited'],
      ['network', 'transient'],
      ['server', 'transient'],
    ] as const)('keeps the confirmation with the %s banner', async (reason, banner) => {
      const { utils, provider, apply } = mount();
      provider.disable.mockResolvedValue(failed(reason));

      await act(async () => utils.result.current.disable({ twoFactorCode: buildTotpCode() }));

      expect(apply).toHaveBeenCalledWith({
        settings: ENABLED,
        view: viewState('disable', { banner }),
      });
    });

    it('publishes nothing for session_ended', async () => {
      const { utils, provider, apply, recordStatus } = mount();
      provider.disable.mockResolvedValue(failed('session_ended'));

      await act(async () => utils.result.current.disable({ twoFactorCode: buildTotpCode() }));

      expect(apply).not.toHaveBeenCalled();
      expect(recordStatus).not.toHaveBeenCalled();
    });

    it('sends one request for two quick activations and reports busy', async () => {
      const { utils, provider } = mount();
      provider.disable.mockReturnValue(new Promise(() => undefined));
      const dto = { twoFactorCode: buildTotpCode() };

      await act(async () => {
        utils.result.current.disable(dto);
        utils.result.current.disable(dto);
      });

      expect(provider.disable).toHaveBeenCalledTimes(1);
      expect(utils.result.current.isSubmitting).toBe(true);
    });
  });

  describe('retry', () => {
    it('sends the last disable again, identical, from the confirmation', async () => {
      const { utils, provider } = mount({
        settings: ENABLED,
        view: viewState('disable', { banner: 'transient' }),
      });
      provider.disable.mockResolvedValue(failed('network'));
      const code = buildTotpCode();

      await act(async () => utils.result.current.disable({ twoFactorCode: code }));
      await act(async () => utils.result.current.retry());

      expect(provider.disable).toHaveBeenCalledTimes(2);
      expect(provider.disable.mock.calls[1]?.[0]).toEqual({ twoFactorCode: code });
    });

    it('does nothing before any disable was sent', async () => {
      const { utils, provider } = mount();

      await act(async () => utils.result.current.retry());

      expect(provider.disable).not.toHaveBeenCalled();
    });

    it.each(['off', 'setup', 'codes', 'on', 'regenerate', 'reauth'] as const)(
      'does nothing from the %s view',
      async (view) => {
        const { utils, provider } = mount({ settings: ENABLED, view: viewState(view) });
        provider.disable.mockResolvedValue(failed('network'));
        await act(async () => utils.result.current.disable({ twoFactorCode: buildTotpCode() }));
        provider.disable.mockClear();

        await act(async () => utils.result.current.retry());

        expect(provider.disable).not.toHaveBeenCalled();
      }
    );
  });
});
