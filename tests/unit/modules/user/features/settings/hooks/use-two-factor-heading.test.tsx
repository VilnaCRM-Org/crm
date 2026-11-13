import { renderHook } from '@testing-library/react';
import * as React from 'react';
import type { JSX, ReactNode } from 'react';
import * as ReactI18next from 'react-i18next';
import { I18nextProvider } from 'react-i18next';

import useTwoFactorHeading from '@/modules/user/features/settings/hooks/use-two-factor-heading';
import createSettingsLocaleI18n from '@tests/unit/utils/create-settings-locale-i18n';
import loadIsolated from '@tests/unit/utils/isolated-module';

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

describe('useTwoFactorHeading tables loaded inside the test', () => {
  const VIEWS = ['off', 'setup', 'codes', 'on', 'disable', 'regenerate', 'reauth'] as const;

  const loadHook = (): Promise<typeof useTwoFactorHeading> =>
    loadIsolated(async () => {
      jest.doMock('react', () => React);
      jest.doMock('react-i18next', () => ReactI18next);
      return (await import('@/modules/user/features/settings/hooks/use-two-factor-heading'))
        .default;
    });

  const headingIn = (
    hook: typeof useTwoFactorHeading,
    state: ReturnType<typeof viewState>,
    from: Parameters<typeof useTwoFactorHeading>[1]
  ): ReturnType<typeof useTwoFactorHeading> =>
    renderHook(() => hook(state, from), { wrapper }).result.current;

  it.each([
    ['off', 'Налаштуйте 2FA'],
    ['setup', 'Налаштуйте 2FA'],
    ['on', '2FA підключено'],
    ['codes', 'Двофакторна автентифікація'],
    ['disable', 'Двофакторна автентифікація'],
    ['regenerate', 'Двофакторна автентифікація'],
    ['reauth', 'Двофакторна автентифікація'],
  ] as const)('titles the %s view "%s"', async (view, title) => {
    const hook = await loadHook();

    expect(headingIn(hook, viewState(view), null).title).toBe(title);
    expect(headingIn(hook, viewState(view, { statusCode: 'stale' }), null).title).toBe(title);
  });

  it('titles every view with the already-on sentence when that status landed', async () => {
    const hook = await loadHook();

    expect(
      VIEWS.map(
        (view) => headingIn(hook, viewState(view, { statusCode: 'already_on' }), null).title
      )
    ).toStrictEqual(VIEWS.map(() => 'Двофакторну автентифікацію вже ввімкнено.'));
  });

  it.each([null, ...VIEWS])('decides focus on arrival from %s', async (from) => {
    const hook = await loadHook();
    const cancelled = from === 'disable' || from === 'regenerate';

    expect(VIEWS.map((view) => headingIn(hook, viewState(view), from).focus)).toStrictEqual([
      false,
      true,
      false,
      from !== null && !cancelled,
      false,
      false,
      false,
    ]);
    expect(headingIn(hook, viewState('on', { statusCode: 'stale' }), from).focus).toBe(true);
    expect(headingIn(hook, viewState('off', { statusCode: 'stale' }), from).focus).toBe(false);
  });
});
