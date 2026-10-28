import { renderHook } from '@testing-library/react';
import type { JSX, ReactNode } from 'react';
import { I18nextProvider } from 'react-i18next';

import useChallengeBanner from '@auth/hooks/use-challenge-banner';
import createTwoFactorLocaleI18n from '@tests/unit/utils/create-two-factor-locale-i18n';

interface WrapperProps {
  readonly children: ReactNode;
}

const wrapperFor = (locale: 'uk' | 'en'): ((props: WrapperProps) => JSX.Element) => {
  function I18nWrapper({ children }: WrapperProps): JSX.Element {
    return <I18nextProvider i18n={createTwoFactorLocaleI18n(locale)}>{children}</I18nextProvider>;
  }
  return I18nWrapper;
};

describe('useChallengeBanner', () => {
  it('has no text and no action without a banner', () => {
    const { result } = renderHook(() => useChallengeBanner(null, jest.fn()), {
      wrapper: wrapperFor('uk'),
    });

    expect(result.current).toEqual({ error: null, action: undefined });
  });

  it('gives the rate-limit text and no action', () => {
    const { result } = renderHook(() => useChallengeBanner('rate_limited', jest.fn()), {
      wrapper: wrapperFor('uk'),
    });

    expect(result.current).toEqual({
      error: 'Забагато спроб. Зачекайте хвилину і спробуйте знову.',
      action: undefined,
    });
  });

  it('gives the transient text and a retry action that calls retry', () => {
    const retry = jest.fn();
    const { result } = renderHook(() => useChallengeBanner('transient', retry), {
      wrapper: wrapperFor('uk'),
    });

    expect(result.current.error).toBe(
      "Не вдалося перевірити код. Перевірте з'єднання та спробуйте ще раз."
    );
    expect(result.current.action?.label).toBe('Спробувати ще раз');
    result.current.action?.onClick();
    expect(retry).toHaveBeenCalledTimes(1);
  });

  it('speaks English when the language is English', () => {
    const { result } = renderHook(() => useChallengeBanner('transient', jest.fn()), {
      wrapper: wrapperFor('en'),
    });

    expect(result.current.error).toBe(
      'The code could not be verified. Check your connection and try again.'
    );
    expect(result.current.action?.label).toBe('Try again');
  });
});
