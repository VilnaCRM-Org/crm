import { renderHook } from '@testing-library/react';

import useTwoFactorSettle from '@/modules/user/features/settings/hooks/use-two-factor-settle';
import { buildRecoveryCodeSet, buildTotpSecret } from '@tests/builders';

import {
  EMPTY_SETTINGS,
  fakeDeps,
  viewState,
  type TwoFactorFailureRow,
  type TwoFactorOperationPlan,
} from './two-factor-test-deps';

const KEPT_SECRET = buildTotpSecret();
const current = {
  settings: { ...EMPTY_SETTINGS, secret: KEPT_SECRET, otpauthUri: 'otpauth://totp/x' },
  view: viewState('setup', { fieldError: 'invalid_code' as const, bannerOccurrence: 3 }),
};

const row = (overrides: Partial<TwoFactorFailureRow> = {}): TwoFactorFailureRow => ({
  view: null,
  fieldError: null,
  statusCode: null,
  record: null,
  ...overrides,
});

const plan = (overrides: Partial<TwoFactorOperationPlan> = {}): TwoFactorOperationPlan => ({
  view: 'codes',
  statusCode: null,
  record: null,
  failures: new Map([['invalid_code', row({ fieldError: 'invalid_code' })]]),
  ...overrides,
});

const setUp = (): ReturnType<typeof fakeDeps> & {
  settle: ReturnType<typeof useTwoFactorSettle>['settle'];
  show: ReturnType<typeof useTwoFactorSettle>['show'];
  refuse: ReturnType<typeof useTwoFactorSettle>['refuse'];
} => {
  const fake = fakeDeps(current);
  const { result } = renderHook(() => useTwoFactorSettle(fake.deps));
  return { ...fake, ...result.current };
};

describe('useTwoFactorSettle', () => {
  it('applies a changed outcome with the plan view, status code and fresh view state', () => {
    const { settle, apply, recordStatus } = setUp();
    const settings = {
      ...EMPTY_SETTINGS,
      status: 'enabled' as const,
      recoveryCodes: buildRecoveryCodeSet(),
    };

    settle(
      { kind: 'changed', settings },
      plan({ view: 'off', statusCode: 'disabled', record: 'disabled' })
    );

    expect(apply).toHaveBeenCalledTimes(1);
    expect(apply).toHaveBeenCalledWith({
      settings,
      view: {
        view: 'off',
        fieldError: null,
        banner: null,
        bannerOccurrence: 0,
        statusCode: 'disabled',
      },
    });
    expect(recordStatus).toHaveBeenCalledWith('disabled');
  });

  it('records no status when the plan has none', () => {
    const { settle, recordStatus } = setUp();

    settle({ kind: 'changed', settings: EMPTY_SETTINGS }, plan({ record: null }));

    expect(recordStatus).not.toHaveBeenCalled();
  });

  it('moves a failure row to its view, status code and recorded status', () => {
    const { settle, apply, recordStatus } = setUp();

    settle(
      { kind: 'failed', reason: 'not_enabled' },
      plan({
        failures: new Map([
          ['not_enabled', row({ view: 'off', statusCode: 'already_off', record: 'disabled' })],
        ]),
      })
    );

    expect(apply).toHaveBeenCalledWith({
      settings: current.settings,
      view: {
        view: 'off',
        fieldError: null,
        banner: null,
        bannerOccurrence: 3,
        statusCode: 'already_off',
      },
    });
    expect(recordStatus).toHaveBeenCalledWith('disabled');
  });

  it('keeps the view and settings for a row without a view, setting its field error', () => {
    const { settle, apply, recordStatus } = setUp();

    settle({ kind: 'failed', reason: 'invalid_code' }, plan());

    expect(apply).toHaveBeenCalledWith({
      settings: current.settings,
      view: {
        view: 'setup',
        fieldError: 'invalid_code',
        banner: null,
        bannerOccurrence: 3,
        statusCode: null,
      },
    });
    expect(recordStatus).not.toHaveBeenCalled();
  });

  it.each([
    ['rate_limited', 'rate_limited'],
    ['network', 'transient'],
    ['server', 'transient'],
    ['already_enabled', 'transient'],
    ['not_enabled', 'transient'],
    ['setup_not_initiated', 'transient'],
    ['invalid_code', 'transient'],
    ['reauth_required', 'transient'],
  ] as const)(
    'shows the %s failure not in the plan as the %s banner, keeping everything',
    (reason, banner) => {
      const { settle, apply, recordStatus } = setUp();

      settle({ kind: 'failed', reason }, plan({ failures: new Map() }));

      expect(apply).toHaveBeenCalledWith({
        settings: current.settings,
        view: { view: 'setup', fieldError: null, banner, bannerOccurrence: 4, statusCode: null },
      });
      expect(recordStatus).not.toHaveBeenCalled();
    }
  );

  it('publishes nothing and records nothing for session_ended', () => {
    const { settle, apply, recordStatus } = setUp();

    settle({ kind: 'failed', reason: 'session_ended' }, plan({ failures: new Map() }));

    expect(apply).not.toHaveBeenCalled();
    expect(recordStatus).not.toHaveBeenCalled();
  });

  it('lets a plan row win over the banner table', () => {
    const { settle, apply } = setUp();
    const reasons = 'rate_limited' as const;

    settle(
      { kind: 'failed', reason: reasons },
      plan({ failures: new Map([[reasons, row({ view: 'reauth' })]]) })
    );

    expect(apply).toHaveBeenCalledWith({
      settings: current.settings,
      view: {
        view: 'reauth',
        fieldError: null,
        banner: null,
        bannerOccurrence: 3,
        statusCode: null,
      },
    });
  });

  it('shows a view with fresh state and the current settings', () => {
    const { show, apply } = setUp();

    show('disable');

    expect(apply).toHaveBeenCalledWith({
      settings: current.settings,
      view: {
        view: 'disable',
        fieldError: null,
        banner: null,
        bannerOccurrence: 0,
        statusCode: null,
      },
    });
  });

  it('refuses with a field error, keeping the view and settings and clearing the banner', () => {
    const { refuse, apply } = setUp();

    refuse('incomplete');

    expect(apply).toHaveBeenCalledWith({
      settings: current.settings,
      view: {
        view: 'setup',
        fieldError: 'incomplete',
        banner: null,
        bannerOccurrence: 3,
        statusCode: null,
      },
    });
  });
});
