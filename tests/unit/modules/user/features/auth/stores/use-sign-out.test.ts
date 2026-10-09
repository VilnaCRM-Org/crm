import { act, renderHook, waitFor } from '@testing-library/react';

import ChunkRetryLoader from '@/lib/reliability/chunk-retry-loader';
import observabilityCore from '@/services/observability/observability-core';
import { authActions } from '@auth/stores';
import useAuthStore from '@auth/stores/use-auth-store';
import useSignOut from '@auth/stores/use-sign-out';
import { buildToken } from '@tests/builders';
import { resetClientStores } from '@tests/utils/reset-client-stores';

const settlePendingPromises = (): Promise<void> =>
  new Promise((resolve) => {
    setTimeout(resolve, 0);
  });

describe('useSignOut', () => {
  beforeEach(() => resetClientStores());
  afterEach(() => {
    jest.restoreAllMocks();
    act(() => resetClientStores());
  });

  it('starts with no sign-out in progress', () => {
    const { result } = renderHook(() => useSignOut());

    expect(result.current.signedOut).toBe(false);
  });

  it('marks the sign-out at once and logs out on the auth store singleton', async () => {
    const token = buildToken();
    useAuthStore.setState({ token });
    const logout = jest.spyOn(authActions, 'logout');
    const { result } = renderHook(() => useSignOut());

    act(() => {
      result.current.signOut();
    });

    expect(result.current.signedOut).toBe(true);
    await waitFor(() => expect(logout).toHaveBeenCalledTimes(1));
    expect(logout.mock.contexts[0]).toBe(authActions);
    expect(useAuthStore.getState().token).toBeNull();
    expect(result.current.signedOut).toBe(true);
  });

  it('clears the sign-out and reports the error when the auth store cannot load', async () => {
    const token = buildToken();
    useAuthStore.setState({ token });
    const error = new Error(buildToken());
    jest.spyOn(ChunkRetryLoader.prototype, 'load').mockRejectedValueOnce(error);
    const captureError = jest
      .spyOn(observabilityCore, 'captureError')
      .mockImplementation(() => undefined);
    const logout = jest.spyOn(authActions, 'logout');
    const { result } = renderHook(() => useSignOut());

    await act(async () => {
      result.current.signOut();
      await settlePendingPromises();
    });

    expect(captureError).toHaveBeenCalledTimes(1);
    expect(captureError).toHaveBeenCalledWith(error, { source: 'auth:sign-out' });
    expect(result.current.signedOut).toBe(false);
    expect(logout).not.toHaveBeenCalled();
    expect(useAuthStore.getState().token).toBe(token);
  });
});
