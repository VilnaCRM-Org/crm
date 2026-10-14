import { renderHook } from '@testing-library/react';
import * as React from 'react';
import { createElement, type ReactNode } from 'react';
import * as ReactI18next from 'react-i18next';
import { I18nextProvider } from 'react-i18next';

import useRecoveryFailureBanner from '@auth/hooks/use-recovery-failure-banner';
import type { RecoveryFailure } from '@auth/types/password-recovery/outcome';
import createRecoveryLocaleI18n from '@tests/unit/utils/create-recovery-locale-i18n';
import loadIsolated from '@tests/unit/utils/isolated-module';

const TRANSIENT = "Не вдалося надіслати запит. Перевірте з'єднання та спробуйте ще раз.";

const bannerFor = (
  failure: RecoveryFailure | null,
  retry: () => Promise<void> = jest.fn()
): ReturnType<typeof useRecoveryFailureBanner> => {
  const i18n = createRecoveryLocaleI18n('uk');
  const wrapper = ({ children }: { children: ReactNode }): ReactNode =>
    createElement(I18nextProvider, { i18n }, children);
  return renderHook(() => useRecoveryFailureBanner(failure, retry), { wrapper }).result.current;
};

describe('useRecoveryFailureBanner', () => {
  it('shows the rate-limit text without an action', () => {
    expect(bannerFor({ reason: 'rate_limited', retryable: false })).toEqual({
      error: 'Забагато запитів. Спробуйте пізніше.',
    });
  });

  it.each(['network', 'server'] as const)(
    'shows the transient text with a Try again action for %s',
    (reason) => {
      const retry = jest.fn().mockResolvedValue(undefined);
      const banner = bannerFor({ reason, retryable: true }, retry);

      expect(banner.error).toBe(TRANSIENT);
      expect(banner.errorAction?.label).toBe('Спробувати ще раз');
      banner.errorAction?.onClick();
      expect(retry).toHaveBeenCalledTimes(1);
    }
  );

  it.each([
    ['invalid_email', { reason: 'invalid_email', retryable: false }],
    ['policy_rejected', { reason: 'policy_rejected', retryable: false }],
    ['invalid_link', { reason: 'invalid_link', retryable: false }],
    ['no failure', null],
  ] as const)('shows no banner for %s', (_name, failure) => {
    expect(bannerFor(failure)).toEqual({ error: null });
  });
});

describe('useRecoveryFailureBanner loaded inside the test', () => {
  it('evaluates the empty banner it returns without a failure', async () => {
    const freshUseBanner = await loadIsolated(async () => {
      jest.doMock('react', () => React);
      jest.doMock('react-i18next', () => ReactI18next);
      return (await import('@auth/hooks/use-recovery-failure-banner')).default;
    });
    const i18n = createRecoveryLocaleI18n('uk');
    const wrapper = ({ children }: { children: ReactNode }): ReactNode =>
      createElement(I18nextProvider, { i18n }, children);

    const { result } = renderHook(() => freshUseBanner(null, jest.fn()), { wrapper });

    expect(result.current).toStrictEqual({ error: null });
  });
});
