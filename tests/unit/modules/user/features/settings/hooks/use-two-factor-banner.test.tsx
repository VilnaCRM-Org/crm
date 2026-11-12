import { renderHook } from '@testing-library/react';
import * as React from 'react';
import type { JSX, ReactNode } from 'react';
import * as ReactI18next from 'react-i18next';
import { I18nextProvider } from 'react-i18next';

import useTwoFactorBanner from '@/modules/user/features/settings/hooks/use-two-factor-banner';
import createSettingsLocaleI18n from '@tests/unit/utils/create-settings-locale-i18n';
import loadIsolated from '@tests/unit/utils/isolated-module';

const wrapper = ({ children }: { children: ReactNode }): JSX.Element => (
  <I18nextProvider i18n={createSettingsLocaleI18n('uk', ['en'])}>{children}</I18nextProvider>
);

describe('useTwoFactorBanner', () => {
  it('has no error and no action without a banner', () => {
    const { result } = renderHook(() => useTwoFactorBanner(null, jest.fn()), { wrapper });

    expect(result.current).toEqual({ error: null, action: undefined });
  });

  it('shows the rate-limited text with no Retry', () => {
    const { result } = renderHook(() => useTwoFactorBanner('rate_limited', jest.fn()), { wrapper });

    expect(result.current.error).toBe('Забагато спроб. Зачекайте хвилину і спробуйте знову.');
    expect(result.current.action).toBeUndefined();
  });

  it('shows the transient text with a Retry that calls the given callback once', () => {
    const retry = jest.fn();
    const { result } = renderHook(() => useTwoFactorBanner('transient', retry), { wrapper });

    expect(result.current.error).toBe(
      "Не вдалося надіслати запит. Перевірте з'єднання та спробуйте ще раз."
    );
    expect(result.current.action?.label).toEqual(expect.any(String));
    expect(result.current.action?.label).not.toBe('');
    result.current.action?.onClick();
    expect(retry).toHaveBeenCalledTimes(1);
  });
});

describe('useTwoFactorBanner table loaded inside the test', () => {
  it.each([
    ['rate_limited', 'Забагато спроб. Зачекайте хвилину і спробуйте знову.', false],
    ['transient', "Не вдалося надіслати запит. Перевірте з'єднання та спробуйте ще раз.", true],
  ] as const)('speaks the %s banner as "%s"', async (banner, text, hasRetry) => {
    const hook = await loadIsolated(async () => {
      jest.doMock('react', () => React);
      jest.doMock('react-i18next', () => ReactI18next);
      return (await import('@/modules/user/features/settings/hooks/use-two-factor-banner')).default;
    });
    const retry = jest.fn();

    const { result } = renderHook(() => hook(banner, retry), { wrapper });

    expect(result.current.error).toBe(text);
    expect(result.current.action === undefined).toBe(!hasRetry);
    result.current.action?.onClick();
    expect(retry).toHaveBeenCalledTimes(hasRetry ? 1 : 0);
  });
});
