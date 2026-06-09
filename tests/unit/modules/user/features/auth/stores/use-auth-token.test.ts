import { act, renderHook } from '@testing-library/react';

import AuthStateVar from '@auth/stores/auth-var';
import useAuthToken from '@auth/stores/use-auth-token';

describe('useAuthToken', () => {
  beforeEach(() => AuthStateVar.reset());
  afterEach(() => act(() => AuthStateVar.reset()));

  it('re-renders on token changes but skips unrelated field changes', () => {
    let hookCalls = 0;
    const { result } = renderHook(() => {
      hookCalls += 1;
      return useAuthToken();
    });
    expect(result.current).toBeNull();

    act(() => AuthStateVar.set({ token: 'tok-1' }));
    expect(result.current).toBe('tok-1');

    const callsAfterToken = hookCalls;
    act(() => AuthStateVar.set({ loginLoading: true }));
    expect(hookCalls).toBe(callsAfterToken);

    act(() => AuthStateVar.set({ token: 'tok-2' }));
    expect(result.current).toBe('tok-2');
  });

  it('stops notifying after unmount', () => {
    const { result, unmount } = renderHook(() => useAuthToken());
    expect(result.current).toBeNull();

    unmount();
    act(() => AuthStateVar.set({ token: 'after-unmount' }));
    expect(AuthStateVar.get().token).toBe('after-unmount');
  });
});
