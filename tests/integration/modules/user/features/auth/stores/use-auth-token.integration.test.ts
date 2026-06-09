import '../../../../../setup';

import { act, renderHook } from '@testing-library/react';

import AuthStateVar from '@auth/stores/auth-var';
import useAuthToken from '@auth/stores/use-auth-token';

describe('useAuthToken integration coverage', () => {
  beforeEach(() => AuthStateVar.reset());
  afterEach(() => act(() => AuthStateVar.reset()));

  it('slices the token for consumers and skips unrelated updates', () => {
    let hookCalls = 0;
    const { result } = renderHook(() => {
      hookCalls += 1;
      return useAuthToken();
    });
    expect(result.current).toBeNull();

    act(() => AuthStateVar.set({ token: 'sliced' }));
    expect(result.current).toBe('sliced');

    const callsAfterToken = hookCalls;
    act(() => AuthStateVar.set({ loginLoading: true }));
    expect(hookCalls).toBe(callsAfterToken);
  });

  it('stops notifying consumers after unmount', () => {
    const { result, unmount } = renderHook(() => useAuthToken());
    expect(result.current).toBeNull();

    unmount();
    act(() => AuthStateVar.set({ token: 'after-unmount' }));
    expect(AuthStateVar.get().token).toBe('after-unmount');
  });
});
