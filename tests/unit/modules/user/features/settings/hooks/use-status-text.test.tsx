import { renderHook } from '@testing-library/react';
import type { JSX, ReactNode } from 'react';
import { I18nextProvider } from 'react-i18next';

import useStatusText from '@/modules/user/features/settings/hooks/use-status-text';
import createSettingsLocaleI18n from '@tests/unit/utils/create-settings-locale-i18n';

import { viewState } from '../components/two-factor-settings/render-panel';

const wrapper = ({ children }: { children: ReactNode }): JSX.Element => (
  <I18nextProvider i18n={createSettingsLocaleI18n('uk', ['en'])}>{children}</I18nextProvider>
);

const textFor = (state: ReturnType<typeof viewState>): string | null =>
  renderHook(() => useStatusText(state), { wrapper }).result.current;

describe('useStatusText', () => {
  it.each([
    ['on', null, 'Двофакторну автентифікацію ввімкнено'],
    ['on', 'already_on', 'Двофакторну автентифікацію вже ввімкнено.'],
    ['off', 'stale', 'Налаштування застаріло. Почніть знову.'],
    ['off', 'disabled', 'Двофакторну автентифікацію вимкнено.'],
    ['off', 'already_off', 'Двофакторну автентифікацію вже вимкнено.'],
  ] as const)('reads %s with code %s as "%s"', (view, code, text) => {
    expect(textFor(viewState(view, { statusCode: code }))).toBe(text);
  });

  it.each(['off', 'setup', 'codes', 'disable', 'regenerate', 'reauth'] as const)(
    'has no text for the %s view without a status code',
    (view) => {
      expect(textFor(viewState(view))).toBeNull();
    }
  );

  it('speaks English when the language is English', () => {
    const english = ({ children }: { children: ReactNode }): JSX.Element => (
      <I18nextProvider i18n={createSettingsLocaleI18n('en', [])}>{children}</I18nextProvider>
    );

    const { result } = renderHook(() => useStatusText(viewState('on')), { wrapper: english });

    expect(result.current).toBe('Two-factor authentication is on');
  });
});
