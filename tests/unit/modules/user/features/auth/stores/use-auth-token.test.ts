import { act, renderHook } from '@testing-library/react';

import AuthStateVar from '@auth/stores/auth-var';
import useAuthToken from '@auth/stores/use-auth-token';
import { buildToken } from '@tests/builders';

// Wraps every unsubscriber handed out by `onNextChange` so tests can assert which
// registrations the hook actually cancels on cleanup.
class UnsubscribeTracker {
  public readonly cancelled: boolean[] = [];

  public install(): void {
    const reactiveVar = AuthStateVar.reactiveVar();
    const realOnNextChange = reactiveVar.onNextChange.bind(reactiveVar);
    jest.spyOn(reactiveVar, 'onNextChange').mockImplementation((listener) => {
      const unsubscribe = realOnNextChange(listener);
      const index = this.cancelled.length;
      this.cancelled.push(false);
      return (): void => {
        this.cancelled[index] = true;
        unsubscribe();
      };
    });
  }
}

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

  it('unregisters the armed listener on unmount', () => {
    const tracker = new UnsubscribeTracker();
    tracker.install();

    const { unmount } = renderHook(() => useAuthToken());
    expect(tracker.cancelled).toEqual([false]);

    unmount();
    expect(tracker.cancelled).toEqual([true]);
  });

  it('cancels the latest registration after re-arming on a token change', () => {
    const tracker = new UnsubscribeTracker();
    tracker.install();

    const { unmount } = renderHook(() => useAuthToken());
    act(() => AuthStateVar.set({ token: buildToken() }));
    expect(tracker.cancelled).toEqual([false, false]);

    unmount();
    expect(tracker.cancelled).toEqual([false, true]);
  });

  // Guards against re-arming with a fresh closure per notification, which would retain an
  // ever-growing wrapper chain (and recursive unsubscribe depth) for mounted consumers.
  it('re-arms the same listener function on every auth change', () => {
    const reactiveVar = AuthStateVar.reactiveVar();
    const realOnNextChange = reactiveVar.onNextChange.bind(reactiveVar);
    const registered: unknown[] = [];
    jest.spyOn(reactiveVar, 'onNextChange').mockImplementation((listener) => {
      registered.push(listener);
      return realOnNextChange(listener);
    });

    const { unmount } = renderHook(() => useAuthToken());
    act(() => AuthStateVar.set({ token: buildToken() }));
    act(() => AuthStateVar.set({ token: buildToken() }));

    expect(registered).toHaveLength(3);
    expect(new Set(registered).size).toBe(1);
    unmount();
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

    act(() => AuthStateVar.set({ token: buildToken() }));
    expect(relistenSpy).not.toHaveBeenCalled();
  });
});
