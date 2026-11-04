import { renderHook } from '@testing-library/react';
import type { JSX, ReactNode } from 'react';
import { I18nextProvider } from 'react-i18next';

import useTwoFactorHeading from '@/modules/user/features/settings/hooks/use-two-factor-heading';
import createSettingsLocaleI18n from '@tests/unit/utils/create-settings-locale-i18n';

import { viewState } from '../components/two-factor-settings/render-panel';

const wrapper = ({ children }: { children: ReactNode }): JSX.Element => (
  <I18nextProvider i18n={createSettingsLocaleI18n('uk', ['en'])}>{children}</I18nextProvider>
);

const headingOf = (
  state: ReturnType<typeof viewState>,
  from: Parameters<typeof useTwoFactorHeading>[1] = null
): ReturnType<typeof useTwoFactorHeading> =>
  renderHook(() => useTwoFactorHeading(state, from), { wrapper }).result.current;

describe('useTwoFactorHeading', () => {
  it.each([
    ['off', 'Налаштуйте 2FA'],
    ['setup', 'Налаштуйте 2FA'],
    ['on', '2FA підключено'],
    ['codes', 'Двофакторна автентифікація'],
    ['disable', 'Двофакторна автентифікація'],
    ['regenerate', 'Двофакторна автентифікація'],
    ['reauth', 'Двофакторна автентифікація'],
  ] as const)('titles the %s view "%s"', (view, title) => {
    expect(headingOf(viewState(view)).title).toBe(title);
  });

  it('titles the already-on outcome with its own sentence', () => {
    expect(headingOf(viewState('on', { statusCode: 'already_on' })).title).toBe(
      'Двофакторну автентифікацію вже ввімкнено.'
    );
  });

  it('keeps the setup title when the off view carries a status', () => {
    expect(headingOf(viewState('off', { statusCode: 'stale' })).title).toBe('Налаштуйте 2FA');
  });

  it('always focuses on entering setup', () => {
    expect(headingOf(viewState('setup')).focus).toBe(true);
  });

  it.each(['off', 'codes', 'disable', 'regenerate', 'reauth'] as const)(
    'never focuses on the %s view',
    (view) => {
      expect(headingOf(viewState(view), 'on').focus).toBe(false);
    }
  );

  it.each([
    ['first render', null, false],
    ['arriving from codes', 'codes', true],
    ['arriving from setup', 'setup', true],
    ['cancelling disable', 'disable', false],
    ['cancelling regenerate', 'regenerate', false],
  ] as const)('on the on view, on %s, focus is %s', (_name, from, focus) => {
    expect(headingOf(viewState('on'), from).focus).toBe(focus);
  });

  it('focuses the on view whenever a status outcome landed there', () => {
    expect(headingOf(viewState('on', { statusCode: 'already_on' }), 'disable').focus).toBe(true);
  });
});
