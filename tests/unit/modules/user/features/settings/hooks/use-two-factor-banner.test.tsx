import { renderHook } from '@testing-library/react';
import type { JSX, ReactNode } from 'react';
import { I18nextProvider } from 'react-i18next';

import useTwoFactorBanner from '@/modules/user/features/settings/hooks/use-two-factor-banner';
import createSettingsLocaleI18n from '@tests/unit/utils/create-settings-locale-i18n';

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
      'Не вдалося виконати дію. Перевірте з’єднання та спробуйте ще раз.'
    );
    expect(result.current.action?.label).toEqual(expect.any(String));
    expect(result.current.action?.label).not.toBe('');
    result.current.action?.onClick();
    expect(retry).toHaveBeenCalledTimes(1);
  });
});
