import '../../../../../setup';

import { act, renderHook } from '@testing-library/react';

import AuthStateVar from '@auth/stores/auth-var';
import useAuthToken from '@auth/stores/use-auth-token';

describe('useAuthToken integration coverage', () => {
  beforeEach(() => AuthStateVar.reset());
  afterEach(() => {
    jest.restoreAllMocks();
    act(() => AuthStateVar.reset());
  });

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

  // Apollo snapshots listeners before notifying, so a listener can fire after the hook's
  // cleanup ran in the same broadcast; it must neither notify React nor re-arm itself.
  it('ignores a notification that races with cleanup in the same broadcast', () => {
    const reactiveVar = AuthStateVar.reactiveVar();
    let unmountHook = (): void => {};
    reactiveVar.onNextChange((): void => unmountHook());

    const { unmount } = renderHook(() => useAuthToken());
    unmountHook = unmount;
    const relistenSpy = jest.spyOn(reactiveVar, 'onNextChange');

    act(() => AuthStateVar.set({ token: 'race' }));
    expect(relistenSpy).not.toHaveBeenCalled();
  });
});
