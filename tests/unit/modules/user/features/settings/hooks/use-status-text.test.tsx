import { renderHook } from '@testing-library/react';
import * as React from 'react';
import type { JSX, ReactNode } from 'react';
import * as ReactI18next from 'react-i18next';
import { I18nextProvider } from 'react-i18next';

import useStatusText from '@/modules/user/features/settings/hooks/use-status-text';
import createSettingsLocaleI18n from '@tests/unit/utils/create-settings-locale-i18n';
import loadIsolated from '@tests/unit/utils/isolated-module';

import { viewState } from '../components/two-factor-settings/render-panel';

const wrapper = ({ children }: { children: ReactNode }): JSX.Element => (
  <I18nextProvider i18n={createSettingsLocaleI18n('uk', ['en'])}>{children}</I18nextProvider>
);

const textFor = (state: ReturnType<typeof viewState>): string | null =>
  renderHook(() => useStatusText(state), { wrapper }).result.current;

describe('useStatusText', () => {
  it.each([
    ['off', 'stale', 'Налаштування застаріло. Почніть знову.'],
    ['off', 'disabled', 'Двофакторну автентифікацію вимкнено.'],
    ['off', 'already_off', 'Двофакторну автентифікацію вже вимкнено.'],
  ] as const)('reads %s with code %s as "%s"', (view, code, text) => {
    expect(textFor(viewState(view, { statusCode: code }))).toBe(text);
  });

  it.each(['off', 'setup', 'codes', 'on', 'disable', 'regenerate', 'reauth'] as const)(
    'has no text for the %s view without a status code',
    (view) => {
      expect(textFor(viewState(view))).toBeNull();
    }
  );

  it('speaks English when the language is English', () => {
    const english = ({ children }: { children: ReactNode }): JSX.Element => (
      <I18nextProvider i18n={createSettingsLocaleI18n('en', [])}>{children}</I18nextProvider>
    );

    const { result } = renderHook(() => useStatusText(viewState('off', { statusCode: 'stale' })), {
      wrapper: english,
    });

    expect(result.current).toBe('This setup has expired. Start again.');
  });
});

describe('useStatusText table loaded inside the test', () => {
  const loadHook = (): Promise<typeof useStatusText> =>
    loadIsolated(async () => {
      jest.doMock('react', () => React);
      jest.doMock('react-i18next', () => ReactI18next);
      return (await import('@/modules/user/features/settings/hooks/use-status-text')).default;
    });

  const textIn = (hook: typeof useStatusText, state: ReturnType<typeof viewState>): string | null =>
    renderHook(() => hook(state), { wrapper }).result.current;

  it.each([
    ['stale', 'Налаштування застаріло. Почніть знову.'],
    ['disabled', 'Двофакторну автентифікацію вимкнено.'],
    ['already_off', 'Двофакторну автентифікацію вже вимкнено.'],
  ] as const)('reads the %s status code as "%s" in every view', async (code, text) => {
    const hook = await loadHook();

    const views = ['off', 'setup', 'codes', 'on', 'disable', 'regenerate', 'reauth'] as const;

    expect(views.map((view) => textIn(hook, viewState(view, { statusCode: code })))).toStrictEqual(
      views.map(() => text)
    );
  });

  it.each(['off', 'setup', 'codes', 'on', 'disable', 'regenerate', 'reauth'] as const)(
    'has no text for the %s view without a code, nor for already_on',
    async (view) => {
      const hook = await loadHook();

      expect(textIn(hook, viewState(view))).toBeNull();
      expect(textIn(hook, viewState(view, { statusCode: 'already_on' }))).toBeNull();
    }
  );
});
