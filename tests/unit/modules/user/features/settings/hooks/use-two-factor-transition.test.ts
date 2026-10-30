import { act, renderHook } from '@testing-library/react';

import useStore from '@/modules/user/features/settings/hooks/use-two-factor-transition';
import { buildOtpauthUri, buildRecoveryCodeSet, buildTotpSecret } from '@tests/builders';

import { EMPTY_SETTINGS, viewState } from './two-factor-test-deps';

const otpauthUri = buildOtpauthUri();
const secret = buildTotpSecret();
const recoveryCodes = buildRecoveryCodeSet();
const FULL = { status: 'unknown' as const, otpauthUri, secret, recoveryCodes };

describe('useTwoFactorTransition', () => {
  it.each([
    ['enabled', 'on', 'enabled'],
    ['disabled', 'off', 'disabled'],
    ['unknown', 'off', 'disabled'],
  ] as const)('starts from the %s status in the %s view', (status, view, entityStatus) => {
    const { result } = renderHook(() => useStore(status));

    expect(result.current.current).toEqual({
      settings: { status: entityStatus, otpauthUri: null, secret: null, recoveryCodes: null },
      view: viewState(view),
    });
  });

  it('reads the same transition as current on mount', () => {
    const { result } = renderHook(() => useStore('enabled'));

    expect(result.current.read()).toBe(result.current.current);
  });

  it.each([
    ['setup', 'disabled', otpauthUri, secret, null],
    ['codes', 'enabled', null, null, recoveryCodes],
    ['off', 'disabled', null, null, null],
    ['on', 'enabled', null, null, null],
    ['disable', 'enabled', null, null, null],
    ['regenerate', 'enabled', null, null, null],
    ['reauth', 'enabled', null, null, null],
  ] as const)(
    'reconciles the %s view to status %s, keeping secrets only where they show',
    (view, status, uri, key, codes) => {
      const { result } = renderHook(() => useStore('disabled'));

      act(() => result.current.apply({ settings: FULL, view: viewState(view) }));

      expect(result.current.current).toEqual({
        settings: { status, otpauthUri: uri, secret: key, recoveryCodes: codes },
        view: viewState(view),
      });
    }
  );

  it('reads the latest transition at once, before the next render', () => {
    const { result } = renderHook(() => useStore('disabled'));
    const { read, apply } = result.current;

    act(() => {
      apply({ settings: EMPTY_SETTINGS, view: viewState('disable') });
      expect(read().view.view).toBe('disable');
    });
  });

  it('keeps read and apply working across renders', () => {
    const { result, rerender } = renderHook(() => useStore('disabled'));
    const { apply } = result.current;
    rerender();

    act(() => apply({ settings: EMPTY_SETTINGS, view: viewState('setup') }));

    expect(result.current.read().view.view).toBe('setup');
    expect(result.current.current.view.view).toBe('setup');
  });
});
