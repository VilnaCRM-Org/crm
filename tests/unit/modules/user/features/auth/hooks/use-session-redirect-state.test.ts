import { renderHook } from '@testing-library/react';
import * as React from 'react';

import type useSessionRedirectStateType from '@auth/hooks/use-session-redirect-state';
import { buildToken } from '@tests/builders';
import loadIsolated from '@tests/unit/utils/isolated-module';

let useSessionRedirectState: typeof useSessionRedirectStateType;

describe('useSessionRedirectState', () => {
  beforeEach(async () => {
    useSessionRedirectState = await loadIsolated(async () => {
      jest.doMock('react', () => React);
      return (await import('@auth/hooks/use-session-redirect-state')).default;
    });
  });

  it('asks for no focus and no notice on a cold visit', () => {
    const { result } = renderHook(() => useSessionRedirectState(null, false));

    expect(result.current).toStrictEqual({ focusMain: false });
  });

  it('hands focus to main without a notice after a sign-out click', () => {
    const { result } = renderHook(() => useSessionRedirectState(null, true));

    expect(result.current).toStrictEqual({ focusMain: true });
  });

  it('keeps the sign-out arrival even while the token is still set', () => {
    const { result } = renderHook(() => useSessionRedirectState(buildToken(), true));

    expect(result.current).toStrictEqual({ focusMain: true });
  });

  it('explains an ended session when a mounted token turns null without a click', () => {
    const token = buildToken();
    const { result, rerender } = renderHook(
      ({ current }: { current: string | null }) => useSessionRedirectState(current, false),
      { initialProps: { current: token as string | null } }
    );

    rerender({ current: null });

    expect(result.current).toStrictEqual({ focusMain: true, notice: 'session_ended' });
  });

  it('treats an empty-string token as no session, like the route guard does', () => {
    const { result, rerender } = renderHook(
      ({ current }: { current: string | null }) => useSessionRedirectState(current, false),
      { initialProps: { current: '' as string | null } }
    );

    rerender({ current: null });

    expect(result.current).toStrictEqual({ focusMain: false });
  });

  it('never marks a cold visit as an ended session after re-rendering', () => {
    const { result, rerender } = renderHook(() => useSessionRedirectState(null, false));

    rerender();

    expect(result.current).toStrictEqual({ focusMain: false });
  });
});
