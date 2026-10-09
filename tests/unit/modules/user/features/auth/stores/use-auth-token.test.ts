import { act, renderHook } from '@testing-library/react';

import useAuthStore from '@auth/stores/use-auth-store';
import useAuthToken from '@auth/stores/use-auth-token';
import { buildToken } from '@tests/builders';
import { resetClientStores } from '@tests/utils/reset-client-stores';

describe('useAuthToken', () => {
  beforeEach(() => resetClientStores());
  afterEach(() => {
    jest.restoreAllMocks();
    act(() => resetClientStores());
  });

  it('re-renders on token changes but skips unrelated field changes', () => {
    let hookCalls = 0;
    const { result } = renderHook(() => {
      hookCalls += 1;
      return useAuthToken();
    });
    expect(result.current).toBeNull();

    const firstToken = buildToken();
    act(() => useAuthStore.setState({ token: firstToken }));
    expect(result.current).toBe(firstToken);

    const callsAfterToken = hookCalls;
    act(() => useAuthStore.setState({ loginLoading: true }));
    expect(hookCalls).toBe(callsAfterToken);

    const secondToken = buildToken();
    act(() => useAuthStore.setState({ token: secondToken }));
    expect(result.current).toBe(secondToken);
  });

  it('stops notifying after unmount', () => {
    let hookCalls = 0;
    const { unmount } = renderHook(() => {
      hookCalls += 1;
      return useAuthToken();
    });
    unmount();
    const callsAfterUnmount = hookCalls;

    const afterUnmountToken = buildToken();
    act(() => useAuthStore.setState({ token: afterUnmountToken }));

    expect(useAuthStore.getState().token).toBe(afterUnmountToken);
    expect(hookCalls).toBe(callsAfterUnmount);
  });

  it('reads a token that was set before the consumer mounted', () => {
    const token = buildToken();
    useAuthStore.setState({ token });

    const { result } = renderHook(() => useAuthToken());

    expect(result.current).toBe(token);
  });
});
