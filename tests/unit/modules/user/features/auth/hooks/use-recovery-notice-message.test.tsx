import { renderHook } from '@testing-library/react';
import type { JSX, ReactNode } from 'react';
import { I18nextProvider } from 'react-i18next';

import useRecoveryNoticeMessage from '@auth/hooks/use-recovery-notice-message';
import createCodesNoticeLocaleI18n from '@tests/unit/utils/create-codes-notice-locale-i18n';

const wrapperFor = (language: 'uk' | 'en'): ((props: { children: ReactNode }) => JSX.Element) => {
  function Wrapper({ children }: { children: ReactNode }): JSX.Element {
    return (
      <I18nextProvider i18n={createCodesNoticeLocaleI18n(language)}>{children}</I18nextProvider>
    );
  }
  return Wrapper;
};

describe('useRecoveryNoticeMessage', () => {
  it.each([
    [1, 'uk', 'Залишився 1 резервний код. Створіть нові коди в налаштуваннях.'],
    [2, 'uk', 'Залишилося 2 резервні коди. Створіть нові коди в налаштуваннях.'],
    [5, 'uk', 'Залишилося 5 резервних кодів. Створіть нові коди в налаштуваннях.'],
    [0, 'uk', 'Резервні коди закінчилися. Створіть нові коди зараз.'],
    [1, 'en', '1 recovery code left. Generate new codes in settings.'],
    [2, 'en', '2 recovery codes left. Generate new codes in settings.'],
    [0, 'en', 'You are out of recovery codes. Generate new codes now.'],
  ] as const)('reads %i in %s as "%s"', (count, language, text) => {
    const { result } = renderHook(() => useRecoveryNoticeMessage(count), {
      wrapper: wrapperFor(language),
    });

    expect(result.current).toBe(text);
  });

  it('starts empty and fills the message after the first commit', () => {
    const rendered: string[] = [];

    renderHook(
      () => {
        const message = useRecoveryNoticeMessage(1);
        rendered.push(message);
        return message;
      },
      { wrapper: wrapperFor('en') }
    );

    expect(rendered[0]).toBe('');
    expect(rendered.at(-1)).toBe('1 recovery code left. Generate new codes in settings.');
  });

  it('follows the count', () => {
    const { result, rerender } = renderHook(({ count }) => useRecoveryNoticeMessage(count), {
      wrapper: wrapperFor('uk'),
      initialProps: { count: 2 },
    });

    rerender({ count: 0 });

    expect(result.current).toBe('Резервні коди закінчилися. Створіть нові коди зараз.');
  });
});
