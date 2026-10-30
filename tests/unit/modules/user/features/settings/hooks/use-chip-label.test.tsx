import { renderHook } from '@testing-library/react';
import type { JSX, ReactNode } from 'react';
import { I18nextProvider } from 'react-i18next';

import useChipLabel from '@/modules/user/features/settings/hooks/use-chip-label';
import createAppShellLocaleI18n from '@tests/unit/utils/create-app-shell-locale-i18n';

const wrapperFor = (locale: 'en' | 'uk') => {
  const i18n = createAppShellLocaleI18n(locale, ['en', 'uk']);

  return function LocaleWrapper({ children }: { children: ReactNode }): JSX.Element {
    return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>;
  };
};

describe('useChipLabel', () => {
  it('is the localized User menu alone without an identity', () => {
    const { result } = renderHook(() => useChipLabel(null), { wrapper: wrapperFor('en') });

    expect(result.current).toBe('User menu');
  });

  it('is the localized User menu alone for an empty display name', () => {
    const { result } = renderHook(() => useChipLabel({ displayName: '', monogram: '' }), {
      wrapper: wrapperFor('uk'),
    });

    expect(result.current).toBe('Меню користувача');
  });

  it('starts with the display name followed by the localized User menu', () => {
    const { result } = renderHook(
      () => useChipLabel({ displayName: 'Анна Коваль', monogram: 'АК' }),
      {
        wrapper: wrapperFor('uk'),
      }
    );

    expect(result.current).toBe('Анна Коваль, Меню користувача');
  });

  it('is the localized User menu alone for a whitespace-only display name', () => {
    const { result } = renderHook(() => useChipLabel({ displayName: '   ', monogram: '' }), {
      wrapper: wrapperFor('en'),
    });

    expect(result.current).toBe('User menu');
  });

  it('names the trimmed display name before the localized User menu', () => {
    const { result } = renderHook(() => useChipLabel({ displayName: ' Ann ', monogram: 'A' }), {
      wrapper: wrapperFor('en'),
    });

    expect(result.current).toBe('Ann, User menu');
  });
});
