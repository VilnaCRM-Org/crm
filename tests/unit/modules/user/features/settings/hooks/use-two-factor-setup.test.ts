import { act } from '@testing-library/react';

import useTwoFactorSetup from '@/modules/user/features/settings/hooks/use-two-factor-setup';
import {
  buildOtpauthUri,
  buildRecoveryCodeSet,
  buildTotpCode,
  buildTotpSecret,
} from '@tests/builders';

import {
  EMPTY_SETTINGS,
  failedOutcome as failed,
  mountWith,
  viewState,
  type Mounted,
  type TwoFactorSettingsOutcome,
  type TwoFactorSetup,
  type TwoFactorSettingsTransition,
} from './two-factor-test-deps';

const offView: TwoFactorSettingsTransition = { settings: EMPTY_SETTINGS, view: viewState('off') };
const setupView: TwoFactorSettingsTransition = {
  settings: { ...EMPTY_SETTINGS, otpauthUri: buildOtpauthUri(), secret: buildTotpSecret() },
  view: viewState('setup'),
};

const mount = (current: TwoFactorSettingsTransition): Mounted<TwoFactorSetup> =>
  mountWith(useTwoFactorSetup, current);

describe('useTwoFactorSetup', () => {
  describe('start', () => {
    it('sends setup once with a live signal and shows the setup view with the entity', async () => {
      const { utils, provider, apply, recordStatus } = mount(offView);
      const settings = {
        ...EMPTY_SETTINGS,
        otpauthUri: buildOtpauthUri(),
        secret: buildTotpSecret(),
      };
      provider.setup.mockResolvedValue({ kind: 'changed', settings });

      await act(async () => utils.result.current.start());

      expect(provider.setup).toHaveBeenCalledTimes(1);
      const signal = provider.setup.mock.calls[0]?.[0] as AbortSignal;
      expect(signal.aborted).toBe(false);
      expect(apply).toHaveBeenCalledWith({ settings, view: viewState('setup') });
      expect(recordStatus).not.toHaveBeenCalled();
    });

    it('sends one request for two quick activations', async () => {
      const { utils, provider } = mount(offView);
      provider.setup.mockReturnValue(new Promise(() => undefined));

      await act(async () => {
        utils.result.current.start();
        utils.result.current.start();
      });

      expect(provider.setup).toHaveBeenCalledTimes(1);
      expect(utils.result.current.isSubmitting).toBe(true);
    });

    it('moves to on with already_on and records enabled when 2FA is already enabled', async () => {
      const { utils, provider, apply, recordStatus } = mount(offView);
      provider.setup.mockResolvedValue(failed('already_enabled'));

      await act(async () => utils.result.current.start());

      expect(apply).toHaveBeenCalledWith({
        settings: EMPTY_SETTINGS,
        view: viewState('on', { statusCode: 'already_on' }),
      });
      expect(recordStatus).toHaveBeenCalledWith('enabled');
    });

    it.each([
      ['rate_limited', 'rate_limited'],
      ['network', 'transient'],
      ['server', 'transient'],
    ] as const)('keeps the off view with the %s banner', async (reason, banner) => {
      const { utils, provider, apply } = mount(offView);
      provider.setup.mockResolvedValue(failed(reason));

      await act(async () => utils.result.current.start());

      expect(apply).toHaveBeenCalledWith({
        settings: EMPTY_SETTINGS,
        view: viewState('off', { banner, bannerOccurrence: 1 }),
      });
    });

    it('publishes nothing for session_ended', async () => {
      const { utils, provider, apply, recordStatus } = mount(offView);
      provider.setup.mockResolvedValue(failed('session_ended'));

      await act(async () => utils.result.current.start());

      expect(apply).not.toHaveBeenCalled();
      expect(recordStatus).not.toHaveBeenCalled();
    });

    it('changes nothing for a run aborted by unmount', async () => {
      const { utils, provider, apply } = mount(offView);
      let release: (outcome: TwoFactorSettingsOutcome) => void = () => undefined;
      provider.setup.mockImplementation(
        (signal: AbortSignal) =>
          new Promise<TwoFactorSettingsOutcome>((resolve) => {
            release = resolve;
            signal.addEventListener('abort', () => resolve(failed('network')));
          })
      );
      act(() => {
        utils.result.current.start();
      });

      utils.unmount();
      await act(async () => release({ kind: 'changed', settings: EMPTY_SETTINGS }));

      expect(apply).not.toHaveBeenCalled();
    });
  });

  describe('confirm', () => {
    it.each(['', '12345', '12 34', 'abcdef', '1234567'])(
      'refuses "%s" as incomplete and sends nothing',
      async (code) => {
        const { utils, provider, apply } = mount(setupView);

        await act(async () => utils.result.current.confirm({ twoFactorCode: code }));

        expect(provider.confirm).not.toHaveBeenCalled();
        expect(apply).toHaveBeenCalledWith({
          settings: setupView.settings,
          view: viewState('setup', { fieldError: 'incomplete' }),
        });
      }
    );

    it('sends the normalised digits once, shows the codes view and records enabled', async () => {
      const { utils, provider, apply, recordStatus } = mount(setupView);
      const code = buildTotpCode();
      const settings = {
        ...EMPTY_SETTINGS,
        status: 'enabled' as const,
        recoveryCodes: buildRecoveryCodeSet(),
      };
      provider.confirm.mockResolvedValue({ kind: 'changed', settings });

      await act(async () =>
        utils.result.current.confirm({ twoFactorCode: ` ${code.slice(0, 3)} ${code.slice(3)} ` })
      );

      expect(provider.confirm).toHaveBeenCalledTimes(1);
      expect(provider.confirm.mock.calls[0]?.[0]).toEqual({ twoFactorCode: code });
      expect(apply).toHaveBeenCalledWith({ settings, view: viewState('codes') });
      expect(recordStatus).toHaveBeenCalledWith('enabled');
    });

    it('keeps the setup view with the invalid_code field error', async () => {
      const { utils, provider, apply, recordStatus } = mount(setupView);
      provider.confirm.mockResolvedValue(failed('invalid_code'));

      await act(async () => utils.result.current.confirm({ twoFactorCode: buildTotpCode() }));

      expect(apply).toHaveBeenCalledWith({
        settings: setupView.settings,
        view: viewState('setup', { fieldError: 'invalid_code' }),
      });
      expect(recordStatus).not.toHaveBeenCalled();
    });

    it('moves to off with the stale status code when setup was not initiated', async () => {
      const { utils, provider, apply, recordStatus } = mount(setupView);
      provider.confirm.mockResolvedValue(failed('setup_not_initiated'));

      await act(async () => utils.result.current.confirm({ twoFactorCode: buildTotpCode() }));

      expect(apply).toHaveBeenCalledWith({
        settings: setupView.settings,
        view: viewState('off', { statusCode: 'stale' }),
      });
      expect(recordStatus).not.toHaveBeenCalled();
    });

    it('keeps the setup view with a banner for rate_limited, network and server', async () => {
      const { utils, provider, apply } = mount(setupView);
      provider.confirm.mockResolvedValue(failed('rate_limited'));

      await act(async () => utils.result.current.confirm({ twoFactorCode: buildTotpCode() }));

      expect(apply).toHaveBeenCalledWith({
        settings: setupView.settings,
        view: viewState('setup', { banner: 'rate_limited', bannerOccurrence: 1 }),
      });
    });
  });

  describe('done', () => {
    it('shows the on view without a status code', () => {
      const { utils, apply } = mount({ settings: EMPTY_SETTINGS, view: viewState('codes') });

      act(() => utils.result.current.done());

      expect(apply).toHaveBeenCalledWith({ settings: EMPTY_SETTINGS, view: viewState('on') });
    });
  });

  describe('a second attempt after a transient failure', () => {
    it('confirms the code as it is now, not the one that failed', async () => {
      const { utils, provider } = mount({
        ...setupView,
        view: viewState('setup', { banner: 'transient', bannerOccurrence: 1 }),
      });
      provider.confirm.mockResolvedValue(failed('network'));
      const first = '123456';
      const edited = '654321';

      await act(async () => utils.result.current.confirm({ twoFactorCode: first }));
      await act(async () => utils.result.current.confirm({ twoFactorCode: edited }));

      expect(provider.confirm).toHaveBeenCalledTimes(2);
      expect(provider.confirm.mock.calls[1]?.[0]).toEqual({ twoFactorCode: edited });
    });

    it('refuses an incomplete edit with the field error and sends nothing', async () => {
      const transient = viewState('setup', { banner: 'transient', bannerOccurrence: 1 });
      const { utils, provider, apply } = mount({ ...setupView, view: transient });

      await act(async () => utils.result.current.confirm({ twoFactorCode: '12' }));

      expect(provider.confirm).not.toHaveBeenCalled();
      expect(apply).toHaveBeenLastCalledWith({
        ...setupView,
        view: { ...transient, fieldError: 'incomplete', banner: null },
      });
    });

    it('offers no separate retry; start and confirm are what the forms submit', () => {
      expect(Object.keys(mount(setupView).utils.result.current).sort()).toEqual([
        'confirm',
        'done',
        'isSubmitting',
        'start',
      ]);
    });
  });
});
