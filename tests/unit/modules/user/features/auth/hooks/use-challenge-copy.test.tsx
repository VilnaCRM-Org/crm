import { renderHook } from '@testing-library/react';
import type { JSX, ReactNode } from 'react';
import { I18nextProvider } from 'react-i18next';

import useChallengeCopy from '@auth/hooks/use-challenge-copy';
import createLocaleI18n from '@tests/unit/utils/create-locale-i18n';

interface WrapperProps {
  readonly children: ReactNode;
}

const wrapperFor = (locale: 'uk' | 'en'): ((props: WrapperProps) => JSX.Element) => {
  function I18nWrapper({ children }: WrapperProps): JSX.Element {
    return <I18nextProvider i18n={createLocaleI18n(locale)}>{children}</I18nextProvider>;
  }
  return I18nWrapper;
};

describe('useChallengeCopy', () => {
  it.each([
    ['totp', 'Введіть шестизначний код із застосунку Google Authenticator.'],
    ['recovery', 'Введіть один із резервних кодів, які ви зберегли під час налаштування.'],
  ] as const)('reads the %s subtitle', (mode, subtitle) => {
    const { result } = renderHook(() => useChallengeCopy(mode), { wrapper: wrapperFor('uk') });

    expect(result.current.subtitle).toBe(subtitle);
  });

  it('gives the shared texts in Ukrainian', () => {
    const { result } = renderHook(() => useChallengeCopy('totp'), { wrapper: wrapperFor('uk') });

    expect(result.current).toMatchObject({
      title: 'Двофакторна автентифікація',
      submitLabel: 'Підтвердити',
      submittingLabel: 'Перевірка…',
    });
  });

  it('gives the shared texts in English', () => {
    const { result } = renderHook(() => useChallengeCopy('totp'), { wrapper: wrapperFor('en') });

    expect(result.current).toMatchObject({
      title: 'Two-factor authentication',
      subtitle: 'Enter the six-digit code from the Google Authenticator app.',
      submitLabel: 'Confirm',
      submittingLabel: 'Verifying…',
    });
  });

  it('gives the five-minute note text', () => {
    const { result } = renderHook(() => useChallengeCopy('totp'), { wrapper: wrapperFor('uk') });

    expect(result.current.note).toBe('Код можна ввести протягом 5 хвилин після входу.');
  });
});
