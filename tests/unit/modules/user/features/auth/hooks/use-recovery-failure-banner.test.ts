import { act, renderHook } from '@testing-library/react';
import * as React from 'react';
import { createElement, type ReactNode } from 'react';
import * as ReactI18next from 'react-i18next';
import { I18nextProvider } from 'react-i18next';

import useRecoveryFailureBanner, {
  RECOVERY_BANNER_LIFETIME_MS,
} from '@auth/hooks/use-recovery-failure-banner';
import type { RecoveryFailure } from '@auth/types/password-recovery/outcome';
import type { RecoveryFailureBanner } from '@auth/types/password-recovery/state';
import createRecoveryLocaleI18n from '@tests/unit/utils/create-recovery-locale-i18n';
import loadIsolated from '@tests/unit/utils/isolated-module';

const TRANSIENT = "Не вдалося надіслати запит. Перевірте з'єднання та спробуйте ще раз.";
const RATE_LIMITED = 'Забагато запитів. Спробуйте пізніше.';

interface Mounted {
  readonly current: () => RecoveryFailureBanner;
  readonly showFailure: (failure: RecoveryFailure | null) => void;
  readonly unmount: () => void;
}

const wrapper = ({ children }: { children: ReactNode }): ReactNode =>
  createElement(I18nextProvider, { i18n: createRecoveryLocaleI18n('uk') }, children);

const mountBanner = (failure: RecoveryFailure | null, dismiss: () => void = jest.fn()): Mounted => {
  const { result, rerender, unmount } = renderHook(
    ({ shown }: { shown: RecoveryFailure | null }) => useRecoveryFailureBanner(shown, dismiss),
    { wrapper, initialProps: { shown: failure } }
  );
  return {
    current: () => result.current,
    showFailure: (next) => rerender({ shown: next }),
    unmount,
  };
};

describe('useRecoveryFailureBanner', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it('shows the rate-limit text', () => {
    expect(mountBanner({ reason: 'rate_limited', retryable: false }).current()).toEqual({
      error: RATE_LIMITED,
    });
  });

  it.each(['network', 'server'] as const)('shows the transient text for %s', (reason) => {
    expect(mountBanner({ reason, retryable: true }).current()).toEqual({ error: TRANSIENT });
  });

  it.each([
    ['invalid_email', { reason: 'invalid_email', retryable: false }],
    ['policy_rejected', { reason: 'policy_rejected', retryable: false }],
    ['invalid_link', { reason: 'invalid_link', retryable: false }],
    ['no failure', null],
  ] as const)('shows no banner and schedules nothing for %s', (_name, failure) => {
    const dismiss = jest.fn();
    expect(mountBanner(failure, dismiss).current()).toEqual({ error: null });

    act(() => jest.advanceTimersByTime(RECOVERY_BANNER_LIFETIME_MS * 2));

    expect(dismiss).not.toHaveBeenCalled();
  });

  it('keeps a banner for five seconds', () => {
    expect(RECOVERY_BANNER_LIFETIME_MS).toBe(5000);
  });

  it.each([
    ['transient', { reason: 'network', retryable: true }],
    ['rate-limit', { reason: 'rate_limited', retryable: false }],
  ] as const)('dismisses the %s banner once its lifetime ends', (_name, failure) => {
    const dismiss = jest.fn();
    mountBanner(failure, dismiss);

    act(() => jest.advanceTimersByTime(RECOVERY_BANNER_LIFETIME_MS - 1));
    expect(dismiss).not.toHaveBeenCalled();

    act(() => jest.advanceTimersByTime(1));
    expect(dismiss).toHaveBeenCalledTimes(1);
  });

  it('calls the dismiss callback of the latest render', () => {
    const first = jest.fn();
    const latest = jest.fn();
    const failure: RecoveryFailure = { reason: 'server', retryable: true };
    const { rerender } = renderHook(
      ({ dismiss }: { dismiss: () => void }) => useRecoveryFailureBanner(failure, dismiss),
      { wrapper, initialProps: { dismiss: first } }
    );

    rerender({ dismiss: latest });
    act(() => jest.advanceTimersByTime(RECOVERY_BANNER_LIFETIME_MS));

    expect(first).not.toHaveBeenCalled();
    expect(latest).toHaveBeenCalledTimes(1);
  });

  it('restarts the lifetime for a new failure', () => {
    const dismiss = jest.fn();
    const banner = mountBanner({ reason: 'network', retryable: true }, dismiss);

    act(() => jest.advanceTimersByTime(RECOVERY_BANNER_LIFETIME_MS - 1000));
    banner.showFailure({ reason: 'server', retryable: true });
    act(() => jest.advanceTimersByTime(RECOVERY_BANNER_LIFETIME_MS - 1));

    expect(dismiss).not.toHaveBeenCalled();
    act(() => jest.advanceTimersByTime(1));
    expect(dismiss).toHaveBeenCalledTimes(1);
  });

  it('stops the countdown once the failure is gone', () => {
    const dismiss = jest.fn();
    const banner = mountBanner({ reason: 'network', retryable: true }, dismiss);

    banner.showFailure(null);
    act(() => jest.advanceTimersByTime(RECOVERY_BANNER_LIFETIME_MS));

    expect(dismiss).not.toHaveBeenCalled();
  });

  it('cancels the pending dismissal on unmount', () => {
    const dismiss = jest.fn();
    const banner = mountBanner({ reason: 'network', retryable: true }, dismiss);

    banner.unmount();
    act(() => jest.advanceTimersByTime(RECOVERY_BANNER_LIFETIME_MS));

    expect(dismiss).not.toHaveBeenCalled();
  });
});

describe('useRecoveryFailureBanner loaded inside the test', () => {
  it('evaluates the empty banner it returns without a failure', async () => {
    const freshUseBanner = await loadIsolated(async () => {
      jest.doMock('react', () => React);
      jest.doMock('react-i18next', () => ReactI18next);
      return (await import('@auth/hooks/use-recovery-failure-banner')).default;
    });

    const { result } = renderHook(() => freshUseBanner(null, jest.fn()), { wrapper });

    expect(result.current).toStrictEqual({ error: null });
  });

  it('evaluates the lifetime constant', async () => {
    const lifetime = await loadIsolated(
      async () =>
        (await import('@auth/hooks/use-recovery-failure-banner')).RECOVERY_BANNER_LIFETIME_MS
    );

    expect(lifetime).toBe(5000);
  });
});
