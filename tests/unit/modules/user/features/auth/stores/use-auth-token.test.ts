import { act, renderHook } from '@testing-library/react';

import AuthStateVar from '@auth/stores/auth-var';
import useAuthToken from '@auth/stores/use-auth-token';
import { buildToken } from '@tests/builders';

describe('useAuthToken', () => {
  beforeEach(() => AuthStateVar.reset());
  afterEach(() => {
    jest.restoreAllMocks();
    act(() => AuthStateVar.reset());
  });

  it('re-renders on token changes but skips unrelated field changes', () => {
    let hookCalls = 0;
    const { result } = renderHook(() => {
      hookCalls += 1;
      return useAuthToken();
    });
    expect(result.current).toBeNull();

    const firstToken = buildToken();
    act(() => AuthStateVar.set({ token: firstToken }));
    expect(result.current).toBe(firstToken);

    const callsAfterToken = hookCalls;
    act(() => AuthStateVar.set({ loginLoading: true }));
    expect(hookCalls).toBe(callsAfterToken);

    const secondToken = buildToken();
    act(() => AuthStateVar.set({ token: secondToken }));
    expect(result.current).toBe(secondToken);
  });

  it('stops notifying after unmount', () => {
    const { result, unmount } = renderHook(() => useAuthToken());
    expect(result.current).toBeNull();

    const afterUnmountToken = buildToken();
    unmount();
    act(() => AuthStateVar.set({ token: afterUnmountToken }));
    expect(AuthStateVar.get().token).toBe(afterUnmountToken);
  });

  it('subscribes to the auth reactive var once and unsubscribes on unmount', () => {
    const reactiveVar = AuthStateVar.reactiveVar();
    const unsubscribe = jest.fn();
    const subscribe = jest.spyOn(reactiveVar, 'subscribe').mockReturnValue(unsubscribe);

    const { unmount } = renderHook(() => useAuthToken());
    expect(subscribe).toHaveBeenCalledTimes(1);
    expect(unsubscribe).not.toHaveBeenCalled();

    unmount();
    expect(unsubscribe).toHaveBeenCalledTimes(1);
  });

  it('reads a token that was set before the consumer mounted', () => {
    const token = buildToken();
    AuthStateVar.set({ token });

    const { result } = renderHook(() => useAuthToken());

    expect(result.current).toBe(token);
  });
});
