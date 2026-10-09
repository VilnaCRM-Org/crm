import '../../../../../setup';

import { act, renderHook } from '@testing-library/react';

import useAuthStore from '@auth/stores/use-auth-store';
import useAuthToken from '@auth/stores/use-auth-token';
import { resetClientStores } from '@tests/utils/reset-client-stores';

describe('useAuthToken integration coverage', () => {
  beforeEach(() => resetClientStores());
  afterEach(() => {
    jest.restoreAllMocks();
    act(() => resetClientStores());
  });

  it('slices the token for consumers and skips unrelated updates', () => {
    let hookCalls = 0;
    const { result } = renderHook(() => {
      hookCalls += 1;
      return useAuthToken();
    });
    expect(result.current).toBeNull();

    act(() => useAuthStore.setState({ token: 'sliced' }));
    expect(result.current).toBe('sliced');

    const callsAfterToken = hookCalls;
    act(() => useAuthStore.setState({ loginLoading: true }));
    expect(hookCalls).toBe(callsAfterToken);
  });

  it('stops notifying consumers after unmount', () => {
    const { result, unmount } = renderHook(() => useAuthToken());
    expect(result.current).toBeNull();

    unmount();
    act(() => useAuthStore.setState({ token: 'after-unmount' }));
    expect(useAuthStore.getState().token).toBe('after-unmount');
  });

  it('survives a subscriber that unmounts the consumer in the same broadcast', () => {
    let unmountHook = (): void => {};
    const unsubscribeProbe = useAuthStore.subscribe((): void => unmountHook());

    const { result, unmount } = renderHook(() => useAuthToken());
    unmountHook = unmount;

    act(() => useAuthStore.setState({ token: 'race' }));

    expect(result.current).toBeNull();
    expect(useAuthStore.getState().token).toBe('race');
    unsubscribeProbe();
  });
});
