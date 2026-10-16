import { renderHook } from '@testing-library/react';

import useSessionRedirectState from '@auth/hooks/use-session-redirect-state';
import { buildToken } from '@tests/builders';

describe('useSessionRedirectState', () => {
  it('asks for no focus and no notice on a cold visit', () => {
    const { result } = renderHook(() => useSessionRedirectState(null, false));

    expect(result.current).toEqual({ focusMain: false });
  });

  it('hands focus to main without a notice after a sign-out click', () => {
    const { result } = renderHook(() => useSessionRedirectState(null, true));

    expect(result.current).toEqual({ focusMain: true });
  });

  it('keeps the sign-out arrival even while the token is still set', () => {
    const { result } = renderHook(() => useSessionRedirectState(buildToken(), true));

    expect(result.current).toEqual({ focusMain: true });
  });

  it('explains an ended session when a mounted token turns null without a click', () => {
    const token = buildToken();
    const { result, rerender } = renderHook(
      ({ current }: { current: string | null }) => useSessionRedirectState(current, false),
      { initialProps: { current: token as string | null } }
    );

    rerender({ current: null });

    expect(result.current).toEqual({ focusMain: true, notice: 'session_ended' });
  });

  it('never marks a cold visit as an ended session after re-rendering', () => {
    const { result, rerender } = renderHook(() => useSessionRedirectState(null, false));

    rerender();

    expect(result.current).toEqual({ focusMain: false });
  });
});
